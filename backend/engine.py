"""
Aequitas AI — Production Fairness Engine
=========================================
All fairness metrics implemented from scratch with NumPy/Pandas/SciPy.
No fairlearn dependency. Real SHAP via sklearn RandomForest + shap library.
Audit history persisted in SQLite (zero config, file-based).
"""

import os
import json
import sqlite3
import warnings
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings("ignore", category=UserWarning)

# ─────────────────────────────────────────
#  DATABASE LAYER (SQLite)
# ─────────────────────────────────────────

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "aequitas.db")


class AuditDatabase:
    """SQLite-backed audit history and model registry."""

    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_schema()

    def _init_schema(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS audit_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    model_id TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    metrics TEXT NOT NULL,
                    dataset_name TEXT DEFAULT '',
                    status TEXT DEFAULT 'UNKNOWN',
                    reasoning TEXT DEFAULT ''
                );
                CREATE TABLE IF NOT EXISTS model_registry (
                    model_id TEXT PRIMARY KEY,
                    model_type TEXT DEFAULT 'Classifier',
                    description TEXT DEFAULT '',
                    registered_at TEXT NOT NULL,
                    last_audit TEXT,
                    fairness_score REAL,
                    status TEXT DEFAULT 'NOT_AUDITED'
                );
                CREATE TABLE IF NOT EXISTS system_config (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            """)
            # Seed default config if empty
            rows = conn.execute("SELECT COUNT(*) FROM system_config").fetchone()[0]
            if rows == 0:
                defaults = [
                    ("fairness_threshold", "0.80"),
                    ("min_sample_size", "200"),
                    ("statistical_engine", "CHI-SQUARE (DEFAULT)"),
                    ("slack_webhook", "https://hooks.slack.com/services/..."),
                    ("compliance_email", "legal-audit@company.com"),
                    ("node_id", "AEQ_772_PROD"),
                    ("region", "US-CENTRAL-1 (BOLTED)"),
                    ("security_level", "FIPS 140-2 LEVEL 3"),
                    ("access_key", "********-****-4211"),
                    ("include_raw_samples", "true"),
                    ("sign_report", "true")
                ]
                conn.executemany("INSERT INTO system_config (key, value) VALUES (?, ?)", defaults)

    # ── Write ──────────────────────────────────────────────────────────────────

    def save_audit(self, model_id: str, metrics: Dict, dataset_name: str = "") -> Dict:
        score = metrics.get("overall_fairness_score", 0)
        status = "PASS" if score >= 90 else "PASS_WITH_WARNINGS" if score >= 75 else "FAIL"
        
        # Build reasoning string
        reasoning = "System passed all fairness parity tests." if status == "PASS" else ""
        if status != "PASS":
            violations = metrics.get("flags", [])
            if violations:
                reasoning = f"Bias detected in groups: {', '.join(violations)}. "
            if score < 75:
                reasoning += "Critical disparate impact threshold breach. Mitigation mandatory."
            elif score < 90:
                reasoning += "Minor parity variance detected. Monitoring recommended."

        ts = datetime.utcnow().isoformat() + "Z"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                "INSERT INTO audit_history (model_id, timestamp, metrics, dataset_name, status, reasoning) "
                "VALUES (?, ?, ?, ?, ?, ?)",
                (model_id, ts, json.dumps(metrics), dataset_name, status, reasoning),
            )
            conn.execute(
                """
                INSERT INTO model_registry
                    (model_id, model_type, description, registered_at, last_audit, fairness_score, status)
                VALUES (?, 'Classifier', '', ?, ?, ?, ?)
                ON CONFLICT(model_id) DO UPDATE SET
                    last_audit = excluded.last_audit,
                    fairness_score = excluded.fairness_score,
                    status = excluded.status
                """,
                (model_id, ts, ts, score, status),
            )
        return {"timestamp": ts, "status": status}

    def delete_audit_history(self, audit_id: int):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("DELETE FROM audit_history WHERE id = ?", (audit_id,))

    # ── Config ──────────────────────────────────────────────────────────────────

    def get_system_config(self) -> Dict[str, str]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("SELECT key, value FROM system_config")
            return {row[0]: row[1] for row in cursor.fetchall()}

    def update_system_config(self, settings: Dict[str, str]):
        with sqlite3.connect(self.db_path) as conn:
            for key, value in settings.items():
                conn.execute(
                    "INSERT INTO system_config (key, value) VALUES (?, ?) "
                    "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    (key, str(value)),
                )

    def register_model(self, model_id: str, model_type: str = "Classifier", description: str = ""):
        ts = datetime.utcnow().isoformat() + "Z"
        with sqlite3.connect(self.db_path) as conn:
            conn.execute(
                """
                INSERT OR IGNORE INTO model_registry
                    (model_id, model_type, description, registered_at, status)
                VALUES (?, ?, ?, ?, 'NOT_AUDITED')
                """,
                (model_id, model_type, description, ts),
            )

    # ── Read ───────────────────────────────────────────────────────────────────

    def _rows_to_dicts(self, rows) -> List[Dict]:
        return [dict(row) for row in rows]

    def get_audit_history(self, model_id: Optional[str] = None, limit: int = 50) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            if model_id:
                rows = conn.execute(
                    "SELECT * FROM audit_history WHERE model_id = ? ORDER BY timestamp DESC LIMIT ?",
                    (model_id, limit),
                ).fetchall()
            else:
                rows = conn.execute(
                    "SELECT * FROM audit_history ORDER BY timestamp DESC LIMIT ?", (limit,)
                ).fetchall()
        result = []
        for row in rows:
            d = dict(row)
            d["metrics"] = json.loads(d["metrics"])
            result.append(d)
        return result

    def get_all_models(self) -> List[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                "SELECT * FROM model_registry ORDER BY COALESCE(last_audit, registered_at) DESC"
            ).fetchall()
        return self._rows_to_dicts(rows)

    def model_exists(self, model_id: str) -> bool:
        with sqlite3.connect(self.db_path) as conn:
            r = conn.execute(
                "SELECT 1 FROM model_registry WHERE model_id = ?", (model_id,)
            ).fetchone()
        return r is not None


# ─────────────────────────────────────────
#  FAIRNESS ENGINE
# ─────────────────────────────────────────


class FairnessEngine:
    """
    Production fairness engine.
    All metrics computed from scratch — no fairlearn dependency.
    SHAP via sklearn RandomForest + shap.TreeExplainer.
    """

    def __init__(self):
        self.db = AuditDatabase()
        self._active_strategy = None
        self._strategy_params = {}
        self.status = "IDLE"  # IDLE, READY, PROCESSING, AUDITED
        self.current_df: Optional[pd.DataFrame] = None
        self.metadata: Dict[str, Any] = {}
        
        # Load system config
        self.config = self.db.get_system_config()
        
        # Internal ML state
        self._model = None
        self._explainer = None
        self._cat_encoders: Dict[str, LabelEncoder] = {}
        self._feature_cols: List[str] = []

    def reset_engine(self):
        """Reset the engine to IDLE state and clear in-memory data."""
        self.current_df = None
        self._model = None
        self._explainer = None
        self._cat_encoders = {}
        self._feature_cols = []
        self.status = "IDLE"
        self.metadata = {}

    def stage_dataset(self, df: pd.DataFrame, filename: str = "uploaded", config: Optional[Dict] = None):
        """Stage a dataset and perform initial cleanup."""
        # Hard cleanup: ensure we have no NaNs in target or protected if specified
        clean_df = df.copy()
        
        detected_config = config or self.auto_detect_config(df)
        p_attr = detected_config.get("protected_attr")
        o_attr = detected_config.get("outcome_attr")
        
        if p_attr and p_attr in clean_df.columns:
            clean_df = clean_df.dropna(subset=[p_attr])
        if o_attr and o_attr in clean_df.columns:
            clean_df = clean_df.dropna(subset=[o_attr])
            
        self.current_df = clean_df
        self.metadata = {
            "filename": filename, 
            "rows": len(clean_df),
            "original_rows": len(df),
            "config": detected_config
        }
        self.status = "READY"

    def start_analysis(self):
        """Perform full model training and SHAP explainer generation."""
        if self.current_df is None:
            raise ValueError("No dataset staged.")
        
        self.status = "PROCESSING"
        try:
            config = self.metadata.get("config", {})
            if not config.get("protected_attr") or not config.get("outcome_attr"):
                # Last ditch effort to detect if missing
                config = self.auto_detect_config(self.current_df)
                self.metadata["config"] = config
                
            self._model, self._explainer = self._train(self.current_df, config)
            self.status = "AUDITED"
            
            # Persistent Audit: Automatically record this event in history
            try:
                self.run_full_audit(
                    df=self.current_df,
                    model_id="UPLOADED_MODEL",
                    protected_attr=config["protected_attr"],
                    outcome_attr=config["outcome_attr"],
                    privileged_group=config.get("privileged_group", "White"),
                    dataset_name=self.metadata.get("filename", "uploaded_audit")
                )
            except Exception as db_err:
                # Log DB error but don't crash the analysis (already complete)
                print(f"Audit persistence failed: {db_err}")
        except Exception as e:
            self.status = "READY"  # Revert to ready on failure
            raise e

    # ── Model Training ─────────────────────────────────────────────────────────

    def _get_features(self, df: pd.DataFrame, protected_attr: str, outcome_attr: str):
        """Identify numerical and categorical features automatically."""
        exclude = {protected_attr, outcome_attr}
        numeric = [
            c for c in df.columns 
            if c not in exclude and df[c].dtype in (int, float, np.int64, np.float64)
        ]
        categorical = [
            c for c in df.columns 
            if c not in exclude and df[c].dtype == object and df[c].nunique() < 100
        ]
        return numeric, categorical

    def _encode(self, df: pd.DataFrame, config: Dict, training: bool = False):
        """Dynamic encoding of features with NaN handling."""
        protected = config.get("protected_attr")
        outcome = config.get("outcome_attr")
        
        num_cols, cat_cols = self._get_features(df, protected, outcome)
        if training:
            self._feature_cols = num_cols + cat_cols
            self._cat_encoders = {c: LabelEncoder() for c in cat_cols}
            
        X = df[self._feature_cols].copy()
        
        # Fill missing values
        for col in num_cols:
            X[col] = X[col].fillna(X[col].median() if not X[col].empty else 0)
            
        for col in cat_cols:
            X[col] = X[col].fillna("MISSING")
            le = self._cat_encoders.get(col)
            if not le: continue
            
            if training:
                X[col] = le.fit_transform(X[col].astype(str))
            else:
                # Handle unseen labels
                known = set(le.classes_)
                X[col] = X[col].astype(str).apply(lambda v: v if v in known else le.classes_[0])
                X[col] = le.transform(X[col])
        
        return X.astype(float)

    def _train(self, df: pd.DataFrame, config: Dict):
        X = self._encode(df, config, training=True)
        y = df[config["outcome_attr"]]
        
        X_tr, _, y_tr, _ = train_test_split(X, y, test_size=0.2, random_state=42)
        clf = RandomForestClassifier(n_estimators=100, max_depth=6, random_state=42, n_jobs=-1)
        clf.fit(X_tr, y_tr)
        
        explainer = shap.TreeExplainer(clf)
        return clf, explainer

    # ─────────────────────────────────────────────────────────────────────────
    #  FAIRNESS METRICS (all from scratch with NumPy)
    # ─────────────────────────────────────────────────────────────────────────

    def _selection_rate(self, series: pd.Series) -> float:
        return float(series.mean()) if len(series) > 0 else 0.0

    def calculate_disparate_impact(
        self,
        df: pd.DataFrame,
        protected_attr: str,
        outcome_attr: str,
        privileged_group: Any,
        unprivileged_group: Any,
    ) -> Dict[str, float]:
        priv = df[df[protected_attr] == privileged_group][outcome_attr]
        unpriv = df[df[protected_attr] == unprivileged_group][outcome_attr]

        priv_rate = self._selection_rate(priv)
        unpriv_rate = self._selection_rate(unpriv)
        di = unpriv_rate / priv_rate if priv_rate > 0 else 0.0
        sp_diff = unpriv_rate - priv_rate

        return {
            "disparate_impact_ratio": round(di, 4),
            "statistical_parity_difference": round(sp_diff, 4),
            "privileged_rate": round(priv_rate, 4),
            "unprivileged_rate": round(unpriv_rate, 4),
            "privileged_n": int(len(priv)),
            "unprivileged_n": int(len(unpriv)),
        }

    def calculate_group_metrics(
        self,
        df: pd.DataFrame,
        protected_attr: str,
        outcome_attr: str,
        privileged_group: str = "White",
    ) -> List[Dict]:
        """Compute DI, Statistical Parity for every group vs. privileged."""
        priv_slice = df[df[protected_attr] == privileged_group]
        if priv_slice.empty:
            if not df[protected_attr].empty:
                privileged_group = str(df[protected_attr].mode()[0])
            priv_slice = df[df[protected_attr] == privileged_group]
            
        priv_rate = self._selection_rate(priv_slice[outcome_attr]) if not priv_slice.empty else 0
        results = []
        for grp in df[protected_attr].unique():
            sub = df[df[protected_attr] == grp][outcome_attr]
            rate = self._selection_rate(sub)
            di = rate / priv_rate if priv_rate > 0 else 0.0
            sp = rate - priv_rate
            results.append({
                "group": str(grp),
                "impact": round(di, 4),
                "parity": round(sp, 4),
                "selection_rate": round(rate, 4),
                "samples": int(len(sub)),
                "below_threshold": bool(di < 0.8),
            })
        return sorted(results, key=lambda x: x["impact"])

    def calculate_overall_fairness_score(self, group_metrics: List[Dict]) -> float:
        if not group_metrics:
            return 100.0
        impacts = [g["impact"] for g in group_metrics]
        raw = float(np.mean([min(i, 1.0) for i in impacts])) * 100
        n_violations = sum(1 for i in impacts if i < 0.8)
        score = max(0.0, min(100.0, raw - n_violations * 3))
        return round(score, 1)

    # ─────────────────────────────────────────────────────────────────────────
    #  SHAP & PROXY DETECTION
    # ─────────────────────────────────────────────────────────────────────────

    def _eta_squared(self, df: pd.DataFrame, feature: str, group_col: str) -> float:
        """One-way ANOVA eta-squared."""
        try:
            overall_mean = df[feature].mean()
            groups = [df[df[group_col] == g][feature].values for g in df[group_col].unique()]
            ss_between = sum(len(g) * (g.mean() - overall_mean) ** 2 for g in groups if len(g) > 0)
            ss_total = ((df[feature] - overall_mean) ** 2).sum()
            return float(ss_between / ss_total) if ss_total > 0 else 0.0
        except:
            return 0.0

    def _cramers_v(self, df: pd.DataFrame, feature: str, group_col: str) -> float:
        """Cramér's V: association between two categorical variables."""
        try:
            a = pd.Categorical(df[group_col]).codes
            b = pd.Categorical(df[feature].astype(str)).codes
            k_a, k_b = int(a.max()) + 1, int(b.max()) + 1
            ct = np.zeros((k_a, k_b))
            for ai, bi in zip(a, b):
                ct[ai, bi] += 1
            n = ct.sum()
            row_s = ct.sum(axis=1, keepdims=True)
            col_s = ct.sum(axis=0, keepdims=True)
            expected = row_s * col_s / n
            mask = expected > 0
            chi2 = float(((ct[mask] - expected[mask]) ** 2 / expected[mask]).sum())
            k = min(k_a, k_b) - 1
            v = np.sqrt(chi2 / (n * k)) if k > 0 else 0.0
            return float(min(1.0, v))
        except:
            return 0.0

    def compute_shap_importance(self, df: Optional[pd.DataFrame] = None) -> List[Dict]:
        if df is None:
            df = self.current_df
        if df is None or self._model is None:
            return []
            
        config = self.metadata.get("config", {})
        protected = config.get("protected_attr", "race")
        
        X = self._encode(df, config)
        sample = X.sample(min(300, len(X)), random_state=42)
        shap_vals = self._explainer.shap_values(sample)
        
        if isinstance(shap_vals, list):
            sv = np.abs(shap_vals[1])
        elif isinstance(shap_vals, np.ndarray) and len(shap_vals.shape) == 3:
            sv = np.abs(shap_vals[:, :, 1])
        else:
            sv = np.abs(shap_vals)
            
        mean_shap = sv.mean(axis=0)

        results = []
        for col, imp in zip(self._feature_cols, mean_shap):
            if col in df.columns:
                proxy = (
                    self._cramers_v(df, col, protected) if df[col].dtype == object
                    else self._eta_squared(df, col, protected)
                )
            else:
                proxy = 0.0
            results.append({
                "feature": col,
                "shap_importance": round(float(imp), 5),
                "proxy_score": round(proxy, 4),
                "is_proxy": bool(proxy > 0.25),
            })
        return sorted(results, key=lambda x: x["shap_importance"], reverse=True)

    def compute_correlation_matrix(self, df: Optional[pd.DataFrame] = None) -> Dict:
        if df is None:
            df = self.current_df
        if df is None:
            return {"features": [], "matrix": []}
            
        config = self.metadata.get("config", {})
        protected = config.get("protected_attr")
        outcome = config.get("outcome_attr")
        
        try:
            # 1. Start with the current feature set
            # Copy dataframe to avoid side effects
            X = df.copy()
            
            # 2. Identify all relevant columns
            cols_to_use = []
            
            # Add standard features (already logic-bound in self._feature_cols)
            for col in self._feature_cols:
                if col in X.columns:
                    cols_to_use.append(col)
            
            # Add Protected/Outcome if missing
            if protected and protected in X.columns and protected not in cols_to_use:
                cols_to_use.append(protected)
            if outcome and outcome in X.columns and outcome not in cols_to_use:
                cols_to_use.append(outcome)
                
            X = X[cols_to_use].copy()
            
            # 3. Force encode everything that is object type
            for col in X.columns:
                if X[col].dtype == object:
                    X[col] = LabelEncoder().fit_transform(X[col].astype(str))
                else:
                    X[col] = X[col].fillna(X[col].median() if not X[col].empty else 0)
            
            # 4. Final sanity check: ensure strictly numeric
            X = X.select_dtypes(include=[np.number])
            
            corr = X.corr(method="pearson").fillna(0).round(3)
            return {
                "features": X.columns.tolist(),
                "matrix": corr.values.tolist(),
            }
        except Exception as e:
            print(f"Correlation matrix failure: {e}")
            return {"features": [], "matrix": []}

    # ─────────────────────────────────────────────────────────────────────────
    #  REMEDIATION SIMULATION
    # ─────────────────────────────────────────────────────────────────────────

    def simulate_threshold_adjustment(
        self, steps: int = 12, privileged_group: str = "White"
    ) -> List[Dict]:
        df = self.current_df
        if df is None or self._model is None:
            return []
            
        config = self.metadata.get("config", {})
        protected = config.get("protected_attr")
        outcome = config.get("outcome_attr")
        
        X = self._encode(df, config)
        y_true = df[outcome].values
        probs = self._model.predict_proba(X)[:, 1]

        curve = []
        for t in np.linspace(0.30, 0.70, steps):
            preds = (probs >= t).astype(int)
            accuracy = float((preds == y_true).mean())
            tmp = df.copy()
            tmp["_pred"] = preds
            groups = self.calculate_group_metrics(tmp, protected, "_pred", privileged_group)
            min_di = min(g["impact"] for g in groups) if groups else 0
            fs = self.calculate_overall_fairness_score(groups)
            curve.append({
                "threshold": round(float(t), 3),
                "accuracy": round(accuracy, 4),
                "min_disparate_impact": round(min_di, 4),
                "fairness_score": fs,
            })
        return curve

    def simulate_reweighting(self, reweight_factor: float = 1.5) -> Dict:
        df = self.current_df
        if df is None or self._model is None:
            return {}
            
        config = self.metadata.get("config", {})
        protected = config.get("protected_attr")
        outcome = config.get("outcome_attr")
        
        X = self._encode(df, config)
        y = df[outcome]

        counts = df[protected].value_counts()
        max_c = counts.max()
        weights = df[protected].map(lambda r: (max_c / counts[r]) ** (reweight_factor / 2))

        clf_rw = RandomForestClassifier(n_estimators=80, max_depth=6, random_state=42, n_jobs=-1)
        clf_rw.fit(X, y, sample_weight=weights.values)

        preds_orig = self._model.predict(X)
        preds_rw = clf_rw.predict(X)
        acc_orig = float((preds_orig == y).mean())
        acc_rw = float((preds_rw == y).mean())

        g_orig = self.calculate_group_metrics(df.assign(_pred=preds_orig), protected, "_pred")
        g_rw = self.calculate_group_metrics(df.assign(_pred=preds_rw), protected, "_pred")

        return {
            "original": {"groups": g_orig, "accuracy": round(acc_orig, 4),
                         "fairness_score": self.calculate_overall_fairness_score(g_orig)},
            "reweighted": {"groups": g_rw, "accuracy": round(acc_rw, 4),
                           "fairness_score": self.calculate_overall_fairness_score(g_rw)},
            "accuracy_delta": round(acc_rw - acc_orig, 4),
            "fairness_delta": round(
                self.calculate_overall_fairness_score(g_rw) - self.calculate_overall_fairness_score(g_orig), 2
            ),
        }

    # ─────────────────────────────────────────────────────────────────────────
    #  LIVE TELEMETRY & FULL AUDIT
    # ─────────────────────────────────────────────────────────────────────────

    def get_live_telemetry(self) -> Dict:
        if self.status != "AUDITED" or self.current_df is None:
            return {
                "status": self.status,
                "fairness_score": 0,
                "model_accuracy": 0,
                "groups": [],
                "total_records": 0,
                "n_violations": 0,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
        config = self.metadata.get("config", {})
        protected = config.get("protected_attr")
        outcome = config.get("outcome_attr")
        
        df = self.current_df.copy()
        X = self._encode(df, config)
        
        if self._active_strategy == "threshold":
            t = self._strategy_params.get("threshold", 0.5)
            probs = self._model.predict_proba(X)[:, 1]
            df["_pred"] = (probs >= t).astype(int)
        else:
            df["_pred"] = self._model.predict(X)

        groups = self.calculate_group_metrics(df, protected, "_pred")
        score = self.calculate_overall_fairness_score(groups)
        accuracy = float((df["_pred"] == df[outcome].values).mean())

        return {
            "fairness_score": score,
            "model_accuracy": round(accuracy, 4),
            "groups": groups,
            "total_records": int(len(df)),
            "n_violations": int(sum(1 for g in groups if g["below_threshold"])),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "active_mitigation": {
                "strategy": self._active_strategy,
                "params": self._strategy_params
            }
        }

    def run_full_audit(
        self,
        df: pd.DataFrame,
        model_id: str,
        protected_attr: str,
        outcome_attr: str,
        privileged_group: str,
        dataset_name: str = "",
    ) -> Dict:
        # Load latest config for real-time compliance
        self.config = self.db.get_system_config()
        threshold = float(self.config.get("fairness_threshold", 0.80)) * 100
        
        # Core fairness computations
        groups = self.calculate_group_metrics(df, protected_attr, outcome_attr, privileged_group)
        score = self.calculate_overall_fairness_score(groups)
        flags = [g["group"] for g in groups if g["below_threshold"]]
        
        # Status driven by dynamic threshold
        # PASS: score >= threshold + 10 (Strict)
        # PASS_WITH_WARNINGS: score >= threshold
        # FAIL: score < threshold
        status = "PASS" if score >= (threshold + 10) else "PASS_WITH_WARNINGS" if score >= threshold else "FAIL"

        # Certification Logic
        risk_level = "SAFE" if score >= (threshold + 10) else "MEDIUM" if score >= threshold else "CRITICAL"
        
        # Proxy Detection
        proxy_data = self.compute_shap_importance(df)
        proxy_features = [f["feature"] for f in proxy_data if f["is_proxy"]]
        
        # Dynamic Recommendations
        recommendations = []
        if score < (threshold + 15):
            recommendations.append("Adjust probability threshold to optimize fairness/accuracy trade-off")
        if flags:
            recommendations.append(f"Review data collection for protected groups: {', '.join(flags)}")
        if proxy_features:
            recommendations.append(f"Consider removing or masking proxy features: {', '.join(proxy_features)}")
        if score < threshold:
            recommendations.append("Critical bias detected. Immediate re-weighting or model retraining required.")
        
        if not recommendations:
            recommendations.append("Maintain current monitoring schedule.")

        metrics: Dict[str, Any] = {
            "overall_fairness_score": score,
            "status": status,
            "risk_level": risk_level,
            "bias_detected": bool(flags),
            "sensitive_feature": protected_attr,
            "proxy_features": proxy_features,
            "recommendations": recommendations,
            "groups": groups,
            "flags": flags,
            "privileged_group": privileged_group,
            "protected_attribute": protected_attr,
            "outcome_attribute": outcome_attr,
            "n_samples": int(len(df)),
        }
        saved = self.db.save_audit(model_id, metrics, dataset_name)
        metrics["timestamp"] = saved["timestamp"]
        metrics["model_id"] = model_id
        return metrics

    def auto_detect_config(self, df: pd.DataFrame) -> Dict:
        protected_candidates = [
            c for c in df.columns
            if df[c].dtype == object and df[c].nunique() <= 10
        ]
        outcome_candidates = [
            c for c in df.columns
            if df[c].dtype in (int, float, np.int64, np.float64) and df[c].nunique() == 2
        ]
        return {
            "protected_attr": protected_candidates[0] if protected_candidates else None,
            "outcome_attr": outcome_candidates[-1] if outcome_candidates else None,
        }
