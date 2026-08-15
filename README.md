# 🛡️ DriftPulse
### AI-Driven IoT Behavioral Drift & Security Telemetry Platform

**DriftPulse** is a state-of-the-art **Security Operations Center (SOC) Intelligence Platform** designed for real-time monitoring of connected IoT assets. It analyzes operational network telemetry to detect behavioral drift, machine learning anomalies, and policy compliance violations, calculating a dynamic **Trust Score (0–100)** for every monitored device.

---

## 🌟 Key Features

### 1. ⚡ Two-Phase SOC Dashboard Workflow
- **Upload Phase (Phase 1)**: Interactive upload portal for raw CSV IoT telemetry logs with instant execution status.
- **Analytics Phase (Phase 2)**: Embedded SOC Operations dashboard displaying live metrics, trust trend graphs, anomaly distribution pie charts, and the embedded **Device Security Overview** audit table.

### 2. 🧠 Machine Learning & Behavioral Analysis
- **Isolation Forest Anomaly Detection**: `StandardScaler` scaled feature engineering pipeline detecting volumetric and duration traffic spikes.
- **Profile-Calibrated Behavioral Drift**: Per-device telemetry baseline comparisons evaluating expected vs actual log traffic.
- **Dynamic Trust Score Computation**:
  $$\text{Trust Score} = 100 - (40 \times \text{Anomaly Score}) - (30 \times \text{Drift Score}) - (30 \times \text{Policy Penalty})$$
- **Risk Level Classification**:
  - `Trust >= 75`: **Low Risk / Compliant** 🟢
  - `60 <= Trust < 75`: **Medium Risk / Warning** 🟡
  - `Trust < 60`: **High Risk / Non-Compliant** 🔴

### 3. 📜 History & Snapshot Intelligence
- Timeline tracking of all historical telemetry analysis runs.
- Full snapshot storage for past graph analytics, donut distributions, and device tables.
- Individual run deletion & full history clear capability.

### 4. 📄 Executive PDF Security Intelligence Reports
- One-click PDF report generation from both Dashboard and History views.
- Vector-rendered **SVG Trend Area Charts** and **SVG Donut Risk Distribution** graphs.
- Complete asset audit table and executive header metadata.

### 5. 🗄️ Database & Migration Architecture
- **Dual Engine Adapter**: PostgreSQL database backend with automatic SQLite fallback (`backend/db.py`).
- **Alembic Migration Tracking**: Versioned database migration pipeline (`backend/alembic/`).

### 6. 🚀 One-Click Cross-Platform Startup
- `run.sh` (Git Bash / Linux / macOS) & `run.bat` (Windows CMD / PowerShell).
- Auto-activates Python virtual environments and runs Alembic migrations prior to booting servers.

---

## 📐 System Architecture & Methodology

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DriftPulse System Flow                          │
└────────────────────────────────────────────────────────────────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    ┌──────────────────────┐               ┌──────────────────────┐
    │   Telemetry Upload   │               │   Test CSV Data      │
    └──────────┬───────────┘               └──────────┬───────────┘
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │   FastAPI REST Backend API  │
                    │      (backend/main.py)      │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
┌──────────────┐         ┌───────────────────┐       ┌────────────────────┐
│ Feature      │         │ Isolation Forest  │       │ Behavioral Drift   │
│ Engineering  │         │ Anomaly Model     │       │ Baseline Profiles  │
└──────┬───────┘         └─────────┬─────────┘       └─────────┬──────────┘
       │                           │                           │
       └───────────────────────────┼───────────────────────────┘
                                   ▼
                    ┌─────────────────────────────┐
                    │  Trust Score & Policy Engine│
                    │   (trust_score.py)          │
                    └──────────────┬──────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ PostgreSQL / SQLite Database │              │ React SOC Dashboard Frontend │
│ (Alembic Versioned Storage)  │              │ (Recharts, SVG PDF Export)   │
└──────────────────────────────┘              └──────────────────────────────┘
```

---

## 📁 Repository Module Structure

```
DriftPulse/
├── run.sh                        # One-click startup script (Git Bash / Bash)
├── run.bat                       # One-click startup script (Windows CMD)
├── test_dataset_1_normal.csv     # Calibrated test dataset (100% Compliant)
├── test_dataset_2_high_drift.csv # Calibrated test dataset (High Drift)
├── test_dataset_3_critical.csv   # Calibrated test dataset (Critical Anomalies)
│
├── backend/                      # FastAPI Python REST Backend
│   ├── main.py                   # REST API routes & analysis orchestrator
│   ├── db.py                     # PostgreSQL & SQLite DB adapter
│   ├── requirements.txt          # Python dependencies
│   ├── alembic.ini               # Alembic migration configuration
│   └── alembic/                  # Alembic migration versions (001_initial_schema)
│
├── aiml/                         # AI/ML Core Pipeline
│   ├── services/
│   │   ├── anomaly_model.py      # Isolation Forest model & scaler
│   │   ├── drift_detection.py    # Drift percentage evaluation
│   │   ├── trust_score.py        # Dynamic trust score & risk classifier
│   │   └── feature_engineering.py# Feature aggregation pipeline
│   └── models/                   # Pre-trained ML model pickle binaries
│
└── frontend/                     # React 19 Frontend Web App
    ├── src/
    │   ├── pages/
    │   │   ├── Dashboard.jsx     # Two-phase SOC Dashboard
    │   │   ├── History.jsx       # Stored snapshots & run history
    │   │   ├── DeviceDetail.jsx  # Individual device deep dive
    │   │   └── Login.jsx         # Sign In & Sign Up auth page
    │   ├── components/           # Navbar, Sidebar, TrendChart, DonutChart
    │   └── utils/
    │       └── generatePdfReport.js # Vector SVG PDF report generator
    ├── package.json
    └── vite.config.js
```

---

## 🛠️ Quick Start & Setup Instructions

### 1. One-Click Automated Run (Recommended)

#### In Git Bash / Linux / macOS:
```bash
./run.sh
```

#### In Windows Command Prompt:
```cmd
run.bat
```

---

### 2. Manual Installation & Execution

#### Step 1: Clone Repository
```bash
git clone https://github.com/your-username/DriftPulse.git
cd DriftPulse
```

#### Step 2: Set Up Backend Virtual Environment
```bash
cd backend
python -m venv .venv

# On Windows (Git Bash):
source .venv/Scripts/activate

# On Linux/macOS:
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

#### Step 3: Run Database Migrations (PostgreSQL / SQLite)
```bash
# Run Alembic migrations to initialize schema
alembic upgrade head
```

#### Step 4: Start Backend API
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
- API Endpoint: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/docs`

#### Step 5: Start Frontend UI
Open a new terminal tab:
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 🧪 Testing with Pre-Calibrated Datasets

DriftPulse includes 3 pre-calibrated test CSV datasets in the root directory:

1. **`test_dataset_1_normal.csv`**: Baseline IoT telemetry. Evaluates to **100% Low Risk / Compliant** 🟢 across all 8 devices (`Trust ~ 76.5`).
2. **`test_dataset_2_high_drift.csv`**: Volumetric network traffic spikes. Evaluates to **High Risk / Non-Compliant** 🔴 (`Trust ~ 38.9`, `Drift = 1.000`).
3. **`test_dataset_3_critical_anomalies.csv`**: Severe anomaly spikes. Evaluates to **High Risk / Non-Compliant** 🔴 (`Trust ~ 34.5`).

---

## 👥 Team & Collaborators

- **Amogh** - *Lead Developer & AI Architect*
- **DriftPulse Core Team**

---

## 📄 License

This project is released under the **MIT License**.