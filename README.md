# 🛡️ Aequitas AI — The Industrial Fairness Kernel

![Aequitas Hero Banner](./aequitas-v2.png)

[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![SHAP](https://img.shields.io/badge/Intelligence-SHAP-E2DED0?style=for-the-badge)](https://shap.readthedocs.io/)
[![Google Cloud](https://img.shields.io/badge/Deployment-Google%20Cloud-4285F4?style=for-the-badge&logo=googlecloud)](https://cloud.google.com/)

**Aequitas AI** is a production-grade, full-stack audit ecosystem designed to solve the "Black Box" problem in modern Machine Learning. We bridge the gap between statistical parity and executive accountability through high-fidelity explainability and automated bias mitigation.

---

## 🚀 Live Production Environment

The system is deployed on **Google Cloud Run** using a hardened, containerized microservices architecture.

- **🌐 Live Dashboard**: [https://aequitas-frontend-687756290895.us-central1.run.app](https://aequitas-frontend-687756290895.us-central1.run.app)
- **⚙️ Backend API**: [https://aequitas-backend-687756290895.us-central1.run.app](https://aequitas-backend-687756290895.us-central1.run.app)

---

## 🧠 The Fairness Engine (Core Intelligence)

Aequitas doesn't just "check" for bias—it computes the **game-theoretic influence** of every feature within your model's decision-making kernel.

### 🔍 Explainable Bias (SHAP)
We utilize **SHAP (SHapley Additive exPlanations)** to decompose model outputs. This allows us to identify if a protected attribute (like Race or Gender) is implicitly driving predictions through latent proxy variables.

### ⚖️ Statistical Parity Kernel
Embedded within our `FairnessEngine` (Python/FastAPI) are real-time compliance monitors:
- **Disparate Impact (4/5ths Rule)**: Automated monitoring of selection rates across demographic groups.
- **Demographic Parity**: Measurement of prediction probability equality.
- **Cramér's V Correlation**: High-precision detection of feature-proxies to prevent "hidden" discrimination.

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph "Data Pipeline"
        CSV[CSV Ingestion] --> Kernel[Fairness Kernel v2.1]
        Kernel --> Store[(Audit History Store)]
    end

    subgraph "Analysis Engine (Python)"
        Kernel --> SHAP[SHAP Value Decomposition]
        Kernel --> Stats[Disparate Impact Logic]
        Kernel --> Rewe[Re-weighting Simulations]
    end

    subgraph "Observability Layer (React 19)"
        SHAP --> UI[Neumorphic Dashboard]
        Stats --> UI
        Rewe --> UI
        UI --> PDF[Authenticated Audit PDF]
    end
```

---

## 🛠️ Developer Setup

### 📦 Prerequisites
- **Python 3.10+** (Linter-hardened)
- **Node.js 20+** (LTS Recommended)
- **Docker** (Optional for containerization)

### 🏗️ Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 🎨 Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🌌 Industrial Aesthetic & Ergonomics
Our UI is built with a **Physical Design (Neumorphic)** aesthetic, optimized for both mission-critical desktop environments and frontline mobile access.

- **Full Mobile Responsiveness**: A custom-built navigation drawer and adaptive grid system (grid-cols-1 to 12) ensure full audit capability on any device.
- **Session Persistence**: Automated `localStorage` synchronization preserves audit progress and wizard states across refreshes or network drops.
- **Framer Motion 12**: Smooth, organic micro-interactions and CRT scanline visual filters.
- **Tailwind CSS 4**: Optimized for native compilation and high-fidelity depth effects.
- **Print Optics**: Hardened CSS for generating high-fidelity, compliance-ready PDF manifests.

---

## 🏁 Roadmap
- [x] **v2.1**: Live Cloud Run Deployment & SHAP Real-time Analysis.
- [x] **v2.5**: AI Advisor Integration — Remediation reasoning & threshold simulation.
- [x] **v2.8**: Production Hardening — Mobile responsiveness & state persistence.
- [ ] **v3.0**: Federated Learning support for private-dataset auditing.

---

**Created for the Google Solution Challenge 2026.**
*Ensuring that as AI scales, Equity scales with it.*
