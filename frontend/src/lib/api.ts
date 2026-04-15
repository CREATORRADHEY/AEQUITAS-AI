/**
 * Aequitas AI — Centralized API Client
 * All backend calls go through this module for consistent error handling and typing.
 */

const BASE_URL = 'https://aequitas-backend-687756290895.us-central1.run.app';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GroupMetric {
  group: string;
  impact: number;
  parity: number;
  selection_rate: number;
  samples: number;
  below_threshold: boolean;
}

export interface TelemetryData {
  fairness_score: number;
  model_accuracy: number;
  groups: GroupMetric[];
  total_records: number;
  n_violations: number;
  timestamp: string;
}

export interface ModelRecord {
  model_id: string;
  model_type: string;
  description: string;
  registered_at: string;
  last_audit: string | null;
  fairness_score: number | null;
  status: string;
}

export interface AuditResult {
  model_id: string;
  overall_fairness_score: number;
  status: string;
  groups: GroupMetric[];
  flags: string[];
  privileged_group: string;
  protected_attribute: string;
  outcome_attribute: string;
  n_samples: number;
  timestamp: string;
}

export interface ShapFeature {
  feature: string;
  shap_importance: number;
  proxy_score: number;
  is_proxy: boolean;
}

export interface ShapResult {
  model_id: string;
  features: ShapFeature[];
  top_proxy: ShapFeature | null;
}

export interface CorrelationMatrix {
  model_id: string;
  features: string[];
  matrix: number[][];
}

export interface ThresholdPoint {
  threshold: number;
  accuracy: number;
  min_disparate_impact: number;
  fairness_score: number;
}

export interface RemediationResult {
  strategy: string;
  pareto_curve?: ThresholdPoint[];
  optimal_threshold?: ThresholdPoint;
  original?: { groups: GroupMetric[]; accuracy: number; fairness_score: number };
  reweighted?: { groups: GroupMetric[]; accuracy: number; fairness_score: number };
  accuracy_delta?: number;
  fairness_delta?: number;
}

export interface AuditHistoryItem {
  id: number;
  model_id: string;
  timestamp: string;
  metrics: AuditResult;
  dataset_name: string;
  status: string;
  reasoning: string;
}

// ─── Fetcher ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const body = await res.text();
      let errorMsg = `API ${res.status}`;
      try {
        const parsed = JSON.parse(body);
        errorMsg = parsed.detail || errorMsg;
      } catch {
        errorMsg = body || errorMsg;
      }
      throw new Error(errorMsg);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Kernel Offline: Check if backend is running at http://localhost:8000');
    }
    throw err;
  }
}

// ─── API Methods ─────────────────────────────────────────────────────────────

export const api = {
  /** Real-time telemetry for dashboard polling */
  getTelemetry: () => apiFetch<TelemetryData>('/telemetry'),

  /** Get the current state of the fairness engine */
  getStatus: () => apiFetch<{ status: string; metadata: any }>('/status'),

  /** Audit history (optional model_id filter) */
  getHistory: (modelId?: string) =>
    apiFetch<AuditHistoryItem[]>(`/history${modelId ? `?model_id=${modelId}` : ''}`),

  /** Delete audit history record */
  deleteHistory: (auditId: number) =>
    apiFetch(`/history/${auditId}`, { method: 'DELETE' }),

  /** All registered models */
  getModels: () => apiFetch<ModelRecord[]>('/models'),

  /** Register a new model */
  registerModel: (model_id: string, model_type: string, description: string) =>
    apiFetch<{ status: string; model_id: string }>('/models/register', {
      method: 'POST',
      body: JSON.stringify({ model_id, model_type, description }),
    }),

  /** Full audit for a model (uses demo dataset) */
  getAudit: (modelId: string, privilegedGroup = 'White') =>
    apiFetch<AuditResult>(`/audit/${modelId}?privileged_group=${privilegedGroup}`),

  /** Upload CSV for audit (Stages data) */
  uploadCsv: (file: File, modelId = 'UPLOADED_MODEL', privilegedGroup = 'White') => {
    const form = new FormData();
    form.append('file', file);
    return fetch(
      `${BASE_URL}/audit/upload?model_id=${modelId}&privileged_group=${privilegedGroup}`,
      { method: 'POST', body: form }
    ).then((r) => {
      if (!r.ok) throw new Error(`Upload failed: ${r.status}`);
      return r.json();
    });
  },

  /** Physically start the model training and bias analysis */
  startAudit: () => apiFetch<{ status: string; engine_status: string }>('/audit/start', { method: 'POST' }),

  /** Clear staged data and reset engine */
  stopAudit: () => apiFetch<{ status: string; engine_status: string }>('/audit/stop', { method: 'POST' }),

  /** SHAP feature importance */
  getShap: (modelId: string) => apiFetch<ShapResult>(`/shap/${modelId}`),

  /** Pearson correlation matrix */
  getCorrelation: (modelId: string) =>
    apiFetch<CorrelationMatrix>(`/correlation/${modelId}`),

  /** Remediation simulation */
  remediate: (strategy: 'threshold' | 'reweighting', opts?: Partial<{
    privileged_group: string;
    reweight_factor: number;
    steps: number;
  }>) =>
    apiFetch<RemediationResult>('/remediate', {
      method: 'POST',
      body: JSON.stringify({ strategy, ...opts }),
    }),

  /** Actually apply a remediation to the live engine */
  applyRemediation: (threshold: number, reweight_factor: number) =>
    apiFetch<{ status: string }>('/remediate/apply', {
      method: 'POST',
      body: JSON.stringify({ threshold, reweight_factor }),
    }),
};
