import sys
import os
import sqlite3
import json
import io
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException, Body, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv
import pandas as pd

# Add project root and aiml directory to python path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
AIML_DIR = os.path.join(PROJECT_ROOT, "aiml")
sys.path.append(AIML_DIR)

# Load env variables
load_dotenv()

# Configure Gemini API
genai_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if genai_api_key:
    genai.configure(api_key=genai_api_key)

from db import get_connection, init_db

app = FastAPI(title="DriftPulse API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-computed baseline total_bytes from original telemetry
baseline_total_bytes = 100000.0  # default fallback

@app.on_event("startup")
def startup_event():
    global baseline_total_bytes
    init_db()
    try:
        from utils.data_loader import load_dataset
        from services.feature_engineering import generate_features
        df_orig = load_dataset()
        features_orig = generate_features(df_orig)
        baseline_total_bytes = float(features_orig["total_bytes"].mean())
        print(f"Loaded original baseline total_bytes: {baseline_total_bytes}")
    except Exception as e:
        print(f"Could not load baseline dataset: {str(e)}")

# Request/Response models
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    role: str = "Operator"

class OtpSendRequest(BaseModel):
    email: str

class OtpVerifyRequest(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str

# Helper to format ISO timestamp
def get_current_timestamp():
    return datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# Format timestamp to HH:MM
def format_time(ts_str):
    try:
        dt = datetime.strptime(ts_str, "%Y-%m-%dT%H:%M:%SZ")
        return dt.strftime("%H:%M")
    except Exception:
        return ts_str[:5]

# Auth Endpoints
@app.post("/api/auth/login")
def login(payload: LoginRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (payload.email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Wrong password")

    return {
        "uid": user["uid"],
        "email": user["email"],
        "role": user["role"]
    }

@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    import uuid
    email = payload.email.strip().lower()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT uid FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    uid = str(uuid.uuid4())
    valid_roles = ["Security Lead", "Operator", "Analyst"]
    role = payload.role if payload.role in valid_roles else "Operator"
    cursor.execute("INSERT INTO users VALUES (?, ?, ?, ?)", (uid, email, payload.password, role))
    conn.commit()
    conn.close()
    return {"uid": uid, "email": email, "role": role}

@app.post("/api/auth/otp/send")
def send_otp(payload: OtpSendRequest):
    return {"status": "success", "message": "OTP sent successfully (simulated)"}

@app.post("/api/auth/otp/verify")
def verify_otp(payload: OtpVerifyRequest):
    return {"status": "success", "message": "OTP verified successfully (simulated)"}

@app.post("/api/auth/reset-password")
def reset_password(payload: ResetPasswordRequest):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (payload.email.strip().lower(),))
    user = cursor.fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=404, detail="No account with that email")
    return {"status": "success", "message": "Password reset link sent (simulated)"}

# Dashboard Summary Endpoint
@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    conn = get_connection()
    cursor = conn.cursor()

    # Total Devices count
    cursor.execute("SELECT COUNT(*) FROM devices")
    total_devices = cursor.fetchone()[0]

    # High Risk Devices
    cursor.execute("SELECT COUNT(*) FROM devices WHERE LOWER(risk) = 'high'")
    high_risk_devices = cursor.fetchone()[0]

    # Avg Trust Score
    cursor.execute("SELECT AVG(trust_score) FROM devices")
    avg_trust_score = cursor.fetchone()[0] or 0.0

    # Active Alerts (excluding Resolved/Closed)
    cursor.execute("SELECT COUNT(*) FROM alerts WHERE LOWER(status) NOT IN ('resolved', 'closed')")
    active_alerts = cursor.fetchone()[0]

    # Overall system trust trend (avg scores grouped by timestamp)
    cursor.execute("""
        SELECT timestamp, AVG(trust_score) as avg_trust, AVG(drift_score) as avg_drift 
        FROM device_history 
        GROUP BY timestamp 
        ORDER BY timestamp DESC 
        LIMIT 5
    """)
    rows = cursor.fetchall()
    conn.close()

    # Chronological format for charts (left-to-right)
    trust_trend = []
    for r in reversed(rows):
        trust_trend.append({
            "time": format_time(r["timestamp"]),
            "trust": round(r["avg_trust"], 1),
            "drift": round(r["avg_drift"], 2)
        })

    # If trend is empty, seed a default single point
    if not trust_trend:
        trust_trend = [{"time": "Now", "trust": round(avg_trust_score, 1), "drift": 0.0}]

    return {
        "totalDevices": total_devices,
        "highRiskDevices": high_risk_devices,
        "avgTrustScore": round(avg_trust_score, 2),
        "activeAlerts": active_alerts,
        "trustTrend": trust_trend
    }

# Devices Endpoints
@app.get("/api/devices")
def get_devices():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices")
    rows = cursor.fetchall()
    conn.close()

    devices = []
    for r in rows:
        devices.append({
            "id": r["id"],
            "ip": r["ip"],
            "type": r["type"],
            "trustScore": r["trust_score"],
            "driftScore": r["drift_score"],
            "anomalyScore": r["anomaly_score"],
            "policy": r["policy"],
            "risk": r["risk"],
            "lastSeen": r["last_seen"],
            "location": r["location"],
            "firmware": r["firmware"],
            "uptime": r["uptime"],
            "logCount": r["log_count"],
            "totalBytes": r["total_bytes"]
        })
    return {"devices": devices}

@app.get("/api/devices/{device_id}")
def get_device_by_id(device_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices WHERE id = ?", (device_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")

    return {
        "device": {
            "id": r["id"],
            "ip": r["ip"],
            "type": r["type"],
            "trustScore": r["trust_score"],
            "driftScore": r["drift_score"],
            "anomalyScore": r["anomaly_score"],
            "policy": r["policy"],
            "risk": r["risk"],
            "lastSeen": r["last_seen"],
            "location": r["location"],
            "firmware": r["firmware"],
            "uptime": r["uptime"],
            "logCount": r["log_count"],
            "totalBytes": r["total_bytes"]
        }
    }

@app.get("/api/devices/{device_id}/trust-trend")
def get_device_trust_trend(device_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, trust_score 
        FROM device_history 
        WHERE device_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 5
    """, (device_id,))
    rows = cursor.fetchall()
    conn.close()

    points = []
    for r in reversed(rows):
        points.append({
            "time": format_time(r["timestamp"]),
            "trust": round(r["trust_score"], 1)
        })
    return {"points": points}

@app.get("/api/devices/{device_id}/drift")
def get_device_drift_trend(device_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT timestamp, drift_score, anomaly_score 
        FROM device_history 
        WHERE device_id = ? 
        ORDER BY timestamp DESC 
        LIMIT 5
    """, (device_id,))
    rows = cursor.fetchall()
    conn.close()

    points = []
    for r in reversed(rows):
        points.append({
            "time": format_time(r["timestamp"]),
            "drift": round(r["drift_score"], 2),
            "anomaly": round(r["anomaly_score"], 2)
        })
    return {"points": points}

# Alerts Endpoint
@app.get("/api/alerts")
def get_alerts():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()

    alerts = []
    for r in rows:
        alerts.append({
            "id": r["id"],
            "deviceId": r["device_id"],
            "type": r["type"],
            "severity": r["severity"],
            "status": r["status"],
            "timestamp": r["timestamp"],
            "resolutionHours": r["resolution_hours"]
        })
    return {"alerts": alerts}

# Anomaly Distribution Endpoint
@app.get("/api/anomalies/distribution")
def get_anomaly_distribution():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT risk, COUNT(*) FROM devices GROUP BY risk")
    rows = cursor.fetchall()
    conn.close()

    counts = {"low": 0, "medium": 0, "high": 0}
    for r in rows:
        risk_key = str(r[0]).lower()
        if risk_key in counts:
            counts[risk_key] = r[1]

    return {
        "distribution": [
            {"name": "Low Risk", "value": counts["low"], "color": "#22C55E"},
            {"name": "Medium Risk", "value": counts["medium"], "color": "#F59E0B"},
            {"name": "High Risk", "value": counts["high"], "color": "#EF4444"}
        ]
    }

# ML Pipeline File Ingestion Endpoint
@app.post("/api/analyze")
async def run_analysis(file: UploadFile = File(...)):
    try:
        # Read uploaded file
        contents = await file.read()
        
        # Load into pandas DataFrame
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate columns
        required_cols = {"device_id", "src_ip", "bytes", "packets", "duration"}
        if not required_cols.issubset(df.columns):
            raise HTTPException(
                status_code=400, 
                detail=f"Uploaded CSV must contain columns: {list(required_cols)}"
            )

        from services.feature_engineering import generate_features
        from services.anomaly_model import load_model, predict_anomaly
        from services.drift_detection import calculate_drift
        from services.trust_score import compute_trust_score, risk_level, policy_status

        # 1. Map device_id -> src_ip mapping
        device_ip_map = df.groupby("device_id")["src_ip"].first().to_dict()

        # 2. Extract features
        features = generate_features(df)

        # 3. Predict anomaly scores
        X = features.select_dtypes(include=["number"])
        
        try:
            model = load_model()
        except Exception:
            # Fallback to training a model if pickle fails or missing
            from services.anomaly_model import train_model
            model = train_model(X)

        anomaly_scores = predict_anomaly(model, X)

        conn = get_connection()
        cursor = conn.cursor()

        now_iso = get_current_timestamp()

        # Seed device descriptions and locations matching prepare_dataset.py
        device_profiles = {
            "CAMERA-01": {"type": "Camera", "location": "Plant A - Zone 1", "firmware": "v2.4.1", "uptime": "40d 2h"},
            "CAMERA-02": {"type": "Camera", "location": "Plant A - Zone 2", "firmware": "v2.4.0", "uptime": "29d 3h"},
            "SENSOR-01": {"type": "Sensor", "location": "Plant B - Zone 1", "firmware": "v1.2.3", "uptime": "121d 1h"},
            "SENSOR-02": {"type": "Sensor", "location": "Plant B - Zone 2", "firmware": "v1.2.3", "uptime": "90d 5h"},
            "GATEWAY-01": {"type": "Gateway", "location": "Plant A - Central Gateway", "firmware": "v4.1.0", "uptime": "15d 12h"},
            "ROUTER-01": {"type": "Router", "location": "Plant B - Router", "firmware": "v3.0.5", "uptime": "46d 6h"},
            "LOCK-01": {"type": "Lock", "location": "Plant C - Entry Door", "firmware": "v1.0.1", "uptime": "6d 0h"},
            "LIGHT-01": {"type": "Light", "location": "Plant C - Light Controls", "firmware": "v1.0.0", "uptime": "93d 9h"}
        }

        devices_processed = 0

        for i, row in features.iterrows():
            dev_id = str(row["device_id"])
            anomaly = float(anomaly_scores[i])
            
            # Calculate drift based on pre-loaded static baseline
            global baseline_total_bytes
            drift = float(calculate_drift(row["total_bytes"], baseline_total_bytes))
            
            policy_penalty = 0.1
            trust = compute_trust_score(anomaly, drift, policy_penalty)
            risk = risk_level(trust)
            policy = policy_status(risk)

            # Get profile data
            prof = device_profiles.get(dev_id, {
                "type": "IoT Device",
                "location": "General Field",
                "firmware": "v1.0.0",
                "uptime": "1d"
            })

            # Check if device exists, otherwise insert
            cursor.execute("SELECT COUNT(*) FROM devices WHERE id = ?", (dev_id,))
            exists = cursor.fetchone()[0] > 0

            ip = device_ip_map.get(dev_id, "N/A")

            log_count = int(row["log_count"])
            total_bytes = float(row["total_bytes"])

            if exists:
                cursor.execute("""
                    UPDATE devices 
                    SET trust_score = ?, drift_score = ?, anomaly_score = ?, policy = ?, risk = ?, last_seen = ?, log_count = ?, total_bytes = ?
                    WHERE id = ?
                """, (trust, drift, anomaly, policy, risk, now_iso, log_count, total_bytes, dev_id))
            else:
                cursor.execute("""
                    INSERT INTO devices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (dev_id, ip, prof["type"], trust, drift, anomaly, policy, risk, now_iso, prof["location"], prof["firmware"], prof["uptime"], log_count, total_bytes))

            # Insert history point
            cursor.execute("""
                INSERT INTO device_history VALUES (?, ?, ?, ?, ?)
            """, (dev_id, now_iso, trust, drift, anomaly))

            # Alert triggering logic
            if risk == "High" or trust < 50:
                cursor.execute("""
                    SELECT COUNT(*) FROM alerts WHERE device_id = ? AND LOWER(status) NOT IN ('resolved', 'closed')
                """, (dev_id,))
                has_active_alert = cursor.fetchone()[0] > 0

                if not has_active_alert:
                    cursor.execute("SELECT COUNT(*) FROM alerts")
                    alert_num = cursor.fetchone()[0] + 1001
                    alert_id = f"ALT-{alert_num}"

                    alert_type = "Baseline drift exceeded threshold"
                    severity = "High"
                    if anomaly > 0.6:
                        alert_type = "Suspicious behavioral anomaly"
                        severity = "Critical"

                    cursor.execute("""
                        INSERT INTO alerts VALUES (?, ?, ?, ?, 'Open', ?, 0.0)
                    """, (alert_id, dev_id, alert_type, severity, now_iso))

            devices_processed += 1

        conn.commit()
        conn.close()


        return {
            "status": "success",
            "devicesProcessed": devices_processed,
            "message": f"Dataset analyzed successfully. Processed {devices_processed} device(s)."
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Pipeline execution failed: {str(e)}")

# AI Explainability Endpoint
@app.get("/api/devices/{device_id}/explainability")
def get_explainability(device_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM devices WHERE id = ?", (device_id,))
    device = cursor.fetchone()
    conn.close()

    if not device:
        raise HTTPException(status_code=404, detail=f"Device {device_id} not found")

    device_data = dict(device)

    # Call AI explainability
    insights = get_ai_explainability_insights(device_data)
    return {"insights": insights}

def get_ai_explainability_insights(device: dict) -> list[dict]:
    dev_id = device["id"]
    dev_type = device["type"]
    ip = device["ip"]
    location = device["location"]
    trust = device["trust_score"]
    drift = device["drift_score"]
    anomaly = device["anomaly_score"]
    policy = device["policy"]
    risk = device["risk"]

    # Try Gemini API if configured
    if genai_api_key:
        try:
            prompt = f"""You are an AI Security Analyst for DriftPulse, an IoT Security Operations Center.
Analyze the following device metrics and generate 1 to 3 structured security insights in JSON format.
Device ID: {dev_id}
Device Type: {dev_type}
IP: {ip}
Location: {location}
Trust Score: {trust}/100
Drift Score: {drift} (0 to 1, where higher means more deviation from baseline)
Anomaly Score: {anomaly} (0 to 1, where higher means more abnormal behavior)
Policy Compliance: {policy}
Risk Level: {risk}

Response must be a valid JSON array of objects, each containing:
- id: a unique string starting with 'EXP-'
- severity: 'low', 'medium', or 'high'
- confidence: integer percentage (0-100) representing your analysis confidence
- title: brief, urgent title (e.g., 'Suspicious outbound traffic spike')
- message: clear explanation of the metric anomaly, its significance, and why this happens (e.g., data drift, command burst, or normal operations)
- action: recommended immediate action (e.g., 'Quarantine Device', 'Run Baseline Update', 'Isolate network', 'Upgrade firmware', 'No action needed')

Do not wrap the response in markdown blocks like ```json ... ```, output ONLY raw JSON."""
            
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean possible markdown wrapping
            if text.startswith("```"):
                lines = text.split("\n")
                if lines[0].startswith("```json") or lines[0].startswith("```"):
                    text = "\n".join(lines[1:-1]).strip()
            
            insights = json.loads(text)
            if isinstance(insights, list):
                return insights
        except Exception as e:
            print(f"Gemini API execution failed, falling back to heuristics: {str(e)}")

    # Heuristics-based local fallback
    insights = []
    confidence = int(max(55, min(95, 100 - trust + (drift * 20) + (anomaly * 20))))

    if anomaly >= 0.6:
        insights.append({
            "id": "EXP-ANOM",
            "severity": "high",
            "confidence": confidence,
            "title": "Behavioral Anomaly Detected",
            "message": f"Device exhibits highly anomalous telemetry behavior (anomaly score {anomaly:.2f}). This may indicate a suspicious command burst or unauthorized protocol scan.",
            "action": "Quarantine Device"
        })

    if drift >= 0.5:
        insights.append({
            "id": "EXP-DRIFT",
            "severity": "medium",
            "confidence": int(max(60, min(90, drift * 100))),
            "title": "Baseline Configuration Drift",
            "message": f"Significant behavioral drift (drift score {drift:.2f}) from the initial baseline has been detected. This suggests potential firmware alterations or workload profile changes.",
            "action": "Run Baseline Update"
        })

    if trust < 50:
        insights.append({
            "id": "EXP-TRUST",
            "severity": "high",
            "confidence": confidence,
            "title": "Low System Trust Threshold",
            "message": f"Trust score has fallen dangerously low ({trust:.1f}/100) due to compounding anomaly and drift indicators. Immediate isolation and manual audit are highly recommended.",
            "action": "Isolate Network Port"
        })

    if not insights:
        insights.append({
            "id": "EXP-NORMAL",
            "severity": "low",
            "confidence": 75,
            "title": "Normal Operations Baseline",
            "message": f"The device is operating completely within the expected baseline parameters with high trust ({trust:.1f}/100) and negligible anomaly indicators.",
            "action": "No Action Needed"
        })

    return insights[:3]
