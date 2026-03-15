import sys
import os
import pandas as pd
import json

# add project root to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from utils.data_loader import load_dataset
from services.feature_engineering import generate_features
from services.anomaly_model import train_model, predict_anomaly
from services.drift_detection import calculate_drift
from services.trust_score import compute_trust_score, risk_level, policy_status


def main():

    try:

        # Load telemetry dataset
        df = load_dataset()

        # Map device → IP
        device_ip_map = df.groupby("device_id")["src_ip"].first().to_dict()

        # Generate aggregated device features
        features = generate_features(df)

        # Use only numeric features for ML
        X = features.select_dtypes(include=["number"])

        # Train anomaly detection model
        model = train_model(X)

        # Predict anomaly scores
        anomaly_scores = predict_anomaly(model, X)

        # Baseline for drift calculation
        baseline = X.mean()

        results = []

        for i, row in features.iterrows():

            anomaly = float(anomaly_scores[i])

            drift = float(
                calculate_drift(
                    row["total_bytes"],
                    baseline["total_bytes"]
                )
            )

            policy_penalty = 0.1

            trust = compute_trust_score(
                anomaly,
                drift,
                policy_penalty
            )

            risk = risk_level(trust)
            policy = policy_status(risk)

            results.append({
                "device_id": str(row["device_id"]),
                "ip_address": device_ip_map.get(row["device_id"], "N/A"),
                "log_count": int(row["log_count"]),
                "total_bytes": float(row["total_bytes"]),
                "anomaly_score": round(anomaly, 3),
                "drift_score": round(drift, 3),
                "trust_score": round(trust, 2),
                "risk_level": risk,
                "policy_status": policy
            })

        # Send JSON output to backend
        print(json.dumps(results))

    except Exception as e:

        error_output = {
            "status": "error",
            "message": str(e)
        }

        print(json.dumps(error_output))


if __name__ == "__main__":
    main()