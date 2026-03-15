# DriftPulse
### AI-Powered IoT Security & Drift Detection Platform

DriftPulse is an **AI-driven Security Operations Center (SOC) platform** designed to monitor IoT device behavior, detect anomalies and configuration drift, and calculate a **dynamic trust score** to identify potential security risks in real time.

The system combines **machine learning anomaly detection, drift analysis, and policy evaluation** to help security teams detect suspicious activity across connected devices.

---

# Features

## AI-Based Security Monitoring
- Isolation Forest anomaly detection
- Behavioral drift detection
- Trust score computation
- Risk level classification

## Security Operations Dashboard
- Real-time SOC dashboard
- Device trust score monitoring
- Drift analytics visualization
- AI-generated security insights

## Device Risk Management
- Device-level security analysis
- Policy compliance monitoring
- Alert generation for high-risk devices
- Detailed device investigation panel

---

# System Architecture

```
Frontend (React Dashboard)
        ↓
Spring Boot Backend APIs
        ↓
Python AI/ML Engine
        ↓
IoT Telemetry Dataset
```

### Components

**Frontend**
- React
- TailwindCSS
- SOC-style monitoring dashboard

**Backend**
- Java Spring Boot
- REST APIs
- Integration with Python AI pipeline

**AI Engine**
- Python
- Scikit-learn
- Isolation Forest anomaly detection
- Drift detection
- Trust score calculation

---

# AI Pipeline

The AI engine processes telemetry data through the following stages:

```
Telemetry Data
      ↓
Feature Engineering
      ↓
Isolation Forest (Anomaly Detection)
      ↓
Drift Detection
      ↓
Policy Evaluation
      ↓
Trust Score Calculation
      ↓
Risk Classification
```

### Trust Score Factors

| Factor | Description |
|------|------|
| Anomaly Score | Behavioral abnormality detected using ML |
| Drift Score | Deviation from baseline device behavior |
| Policy Penalty | Security policy violations |

Final trust score determines device risk level:

```
Trust > 80 → Low Risk  
Trust 50–80 → Medium Risk  
Trust < 50 → High Risk
```

---

# Dashboard Pages

## Security Operations Center
Displays:

- Total devices monitored
- High-risk devices
- Average trust score
- Active alerts
- Trust vs drift trends
- Anomaly distribution

---

## Alerts Management
Shows:

- Critical security alerts
- Device threat details
- Alert severity classification
- Investigation status

---

## Device Security Analysis
Provides:

- Device trust score
- Policy compliance status
- Drift severity analysis
- AI-generated security insights

---

# API Endpoints

| Endpoint | Description |
|--------|--------|
| `/api/dashboard/summary` | Dashboard statistics |
| `/api/devices` | List all monitored devices |
| `/api/devices/{id}` | Device details |
| `/api/devices/{id}/trust-trend` | Trust score trend |
| `/api/devices/{id}/drift` | Drift analytics |
| `/api/devices/high-risk` | High risk devices |
| `/api/anomalies/distribution` | Anomaly distribution |
| `/api/alerts` | Security alerts |
| `/api/analyze` | Run AI analysis pipeline |

---

# Project Structure

```
DriftPulse
│
├── backend
│   ├── controller
│   ├── service
│   ├── dto
│   └── config
│
├── aiml
│   ├── dataset
│   ├── pipeline
│   ├── services
│   └── utils
│
├── frontend
│   ├── components
│   ├── pages
│   └── services
│
└── README.md
```

---

# Dataset Download

Due to size limitations, datasets are **not included in this repository**.

Download them using the Google Drive link below.

```
https://drive.google.com/drive/folders/1YaWIEzsMFQdaC4IULBtGbCC74JoX2Gp3?usp=sharing
```

After downloading, place the files inside:

```
aiml/dataset/
```

Required dataset files:

```
aiml/dataset/iot_telemetry.csv
aiml/dataset/iot23_preprocessed.csv
```

---

# Installation Guide

## 1 Clone the Repository

```
git clone https://github.com/your-username/DriftPulse.git
cd DriftPulse
```

---

## 2 Backend Setup

```
cd backend
mvn clean install
mvn spring-boot:run
```

Backend runs on:

```
http://localhost:8082
```

---

## 3 AI Engine Setup

Install Python dependencies:

```
pip install -r requirements.txt
```

Run analysis pipeline:

```
python aiml/pipeline/analyze_device.py
```

---

## 4 Frontend Setup

```
cd frontend
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# Technologies Used

| Category | Technology |
|------|------|
Frontend | React, TailwindCSS |
Backend | Spring Boot |
AI/ML | Python, Scikit-learn |
Data Processing | Pandas |
Visualization | Chart.js |

---

# Future Improvements

- Real-time telemetry ingestion
- Kafka streaming pipeline
- LSTM-based anomaly detection
- Automated device quarantine
- Threat intelligence integration

---

# License

This project is developed using MIT License.

---

# Author

DriftPulse Development Team 