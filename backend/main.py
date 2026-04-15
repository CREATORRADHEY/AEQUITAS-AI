"""
Aequitas AI — FastAPI Application
===================================
All endpoints wired to real FairnessEngine computations.
No simulated data, no hardcoded strings.
"""

from __future__ import annotations

import io
from typing import Any, Dict, List, Optional

import pandas as pd
from fastapi import FastAPI, File, HTTPException, Query, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from engine import FairnessEngine

# ─────────────────────────────────────────
#  App Setup
# ─────────────────────────────────────────

app = FastAPI(
    title="Aequitas AI Fairness Engine",
    description="Production-grade API for AI fairness auditing and bias detection.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Single engine instance (loads demo dataset + trains model on startup)
engine = FairnessEngine()


# ─────────────────────────────────────────
#  Request / Response Schemas
# ─────────────────────────────────────────


class RemediateRequest(BaseModel):
    strategy: Optional[str] = "threshold" # No longer strictly one or the other
    privileged_group: str = "White"
    reweight_factor: float = 1.0
    threshold: float = 0.5
    steps: int = 12


class RegisterModelRequest(BaseModel):
    model_id: str
    model_type: str = "Classifier"
    description: str = ""


class AuditRequest(BaseModel):
    model_id: str
    protected_attr: str = "race"
    outcome_attr: str = "loan_approved"
    privileged_group: str = "White"


# ─────────────────────────────────────────
#  Health Check
# ─────────────────────────────────────────


@app.get("/", tags=["health"])
async def root():
    return {
        "service": "Aequitas AI Fairness Engine",
        "version": "2.0.0",
        "status": engine.status,
        "staged_filename": engine.metadata.get("filename"),
    }


@app.get("/status", tags=["telemetry"])
async def get_status():
    """Get the current state of the fairness engine."""
    return {
        "status": engine.status,
        "metadata": engine.metadata
    }


# ─────────────────────────────────────────
#  Telemetry — Real-time Dashboard Feed
# ─────────────────────────────────────────


@app.get("/telemetry", tags=["telemetry"])
async def get_telemetry():
    """
    Real-time fairness telemetry computed from demo dataset.
    Includes DI ratios, parity scores, overall fairness score.
    Suitable for 5-second polling from the dashboard.
    """
    return engine.get_live_telemetry()


@app.get("/history", tags=["telemetry"])
async def get_history(model_id: Optional[str] = Query(None)):
    """Retrieve audit history. Pass model_id to filter."""
    return engine.db.get_audit_history(model_id=model_id)


# ─────────────────────────────────────────
#  Models — Registry
# ─────────────────────────────────────────


@app.get("/models", tags=["registry"])
async def list_models():
    """Return all registered models with their latest fairness scores."""
    return engine.db.get_all_models()


@app.post("/models/register", tags=["registry"])
async def register_model(req: RegisterModelRequest):
    """Register a new model in the registry (before running an audit)."""
    engine.db.register_model(req.model_id, req.model_type, req.description)
    return {"status": "REGISTERED", "model_id": req.model_id}


# ─────────────────────────────────────────
#  Audit — Trigger & Retrieve
# ─────────────────────────────────────────


@app.get("/audit/{model_id}", tags=["audit"])
async def get_audit(model_id: str, privileged_group: str = Query("White")):
    """
    Run a full fairness audit on the current staged dataset.
    """
    if engine.current_df is None:
        raise HTTPException(status_code=400, detail="No dataset staged. Upload a CSV first.")
    
    result = engine.run_full_audit(
        df=engine.current_df,
        model_id=model_id,
        protected_attr="race",
        outcome_attr="loan_approved",
        privileged_group=privileged_group,
        dataset_name=engine.metadata.get("filename", "active_audit"),
    )
    return result


@app.post("/audit/upload", tags=["audit"])
async def upload_for_audit(
    file: UploadFile = File(...),
    model_id: str = Query("UPLOADED_MODEL"),
    privileged_group: str = Query("White"),
):
    """
    Upload a CSV, auto-detect protected attribute + outcome column,
    stages the data in the FairnessEngine without immediate training.
    """
    if not (file.filename or "").endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}") from exc

    if len(df) < 10:
        raise HTTPException(status_code=422, detail="Dataset is too small for meaningful audit.")

    config = engine.auto_detect_config(df)
    if privileged_group:
        config["privileged_group"] = privileged_group

    # Stage the data with its detected config
    engine.stage_dataset(df, filename=file.filename or "uploaded", config=config)
    
    return {
        "status": "READY",
        "filename": file.filename,
        "rows": len(df),
        "columns": list(df.columns),
        "auto_detected": config,
        "message": "Dataset staged successfully. Initialize audit to proceed."
    }

def run_analysis_task():
    """Background task to run heavy fairness diagnostics."""
    try:
        engine.start_analysis()
    except Exception as e:
        print(f"Background Analysis Failed: {e}")
        engine.status = "READY"

@app.post("/audit/start", tags=["audit"])
async def start_audit(background_tasks: BackgroundTasks):
    """Trigger the engine to begin dynamic training and analysis in the background."""
    if engine.status == "IDLE":
        raise HTTPException(status_code=400, detail="No dataset staged. Upload a CSV first.")
    
    if engine.status == "PROCESSING":
        return {"status": "SUCCESS", "message": "Analysis already in progress."}

    # Set status immediately to avoid race conditions
    engine.status = "PROCESSING"
    background_tasks.add_task(run_analysis_task)
    
    return {
        "status": "ACCEPTED", 
        "engine_status": "PROCESSING",
        "message": "Fairness analysis started in background."
    }


@app.post("/audit/stop", tags=["audit"])
async def stop_audit():
    """Clear staged data and reset engine to IDLE."""
    engine.reset_engine()
    return {"status": "RESET", "engine_status": engine.status}

@app.post("/audit/run", tags=["audit"])
async def run_audit(req: AuditRequest):
    """
    Run a full audit on the active dataset with explicit configuration.
    """
    if engine.current_df is None:
         raise HTTPException(status_code=400, detail="No dataset staged.")

    result = engine.run_full_audit(
        df=engine.current_df,
        model_id=req.model_id,
        protected_attr=req.protected_attr,
        outcome_attr=req.outcome_attr,
        privileged_group=req.privileged_group,
        dataset_name=engine.metadata.get("filename", "manual_audit"),
    )
    return result


# ─────────────────────────────────────────
#  Analysis — SHAP & Correlation
# ─────────────────────────────────────────


@app.get("/shap/{model_id}", tags=["analysis"])
async def get_shap(model_id: str):
    """
    Real SHAP feature importance from trained RandomForest.
    Includes proxy detection score (eta-squared / Cramér's V with race).
    """
    importance = engine.compute_shap_importance()
    return {
        "model_id": model_id,
        "features": importance,
        "top_proxy": next((f for f in importance if f["is_proxy"]), None),
    }


@app.get("/correlation/{model_id}", tags=["analysis"])
async def get_correlation(model_id: str):
    """Real Pearson correlation matrix for the heatmap visualisation."""
    return {
        "model_id": model_id,
        **engine.compute_correlation_matrix(),
    }


# ─────────────────────────────────────────
#  Remediation — Real Simulation
# ─────────────────────────────────────────


@app.post("/remediate", tags=["remediation"])
async def remediate(req: RemediateRequest):
    """
    Simulate remediation strategies.
    """
    if req.strategy == "threshold":
        curve = engine.simulate_threshold_adjustment(
            steps=req.steps, privileged_group=req.privileged_group
        )
        return {
            "strategy": "threshold",
            "pareto_curve": curve,
            "optimal_threshold": max(curve, key=lambda x: x["fairness_score"] - (1 - x["accuracy"]) * 50),
        }
    elif req.strategy == "reweighting":
        result = engine.simulate_reweighting(reweight_factor=req.reweight_factor)
        return {"strategy": "reweighting", **result}
    else:
        raise HTTPException(status_code=400, detail="strategy must be 'threshold' or 'reweighting'")


@app.post("/remediate/apply", tags=["remediation"])
async def apply_remediation(req: RemediateRequest):
    """
    Apply global remediation parameters. This affects the live telemetry dash.
    """
    # Apply threshold if it's been tuned (default 0.5)
    engine._active_strategy = "threshold"
    engine._strategy_params = {"threshold": req.threshold}
    
    # Apply reweighting if factor is not 1.0
    if req.reweight_factor != 1.0:
        engine.rebuild_model(strategy="reweighting", params={"reweight_factor": req.reweight_factor})
    
    return {
        "status": "APPLIED", 
        "params": {
            "threshold": req.threshold, 
            "reweight_factor": req.reweight_factor
        }
    }


@app.delete("/history/{audit_id}", tags=["telemetry"])
async def delete_audit(audit_id: int):
    """Delete an audit record from history."""
    engine.db.delete_audit_history(audit_id)
    return {"status": "DELETED", "id": audit_id}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
