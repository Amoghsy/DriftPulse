from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "anomaly_model.pkl")

def train_model(X):
    # Initialize scaler and fit on data
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=500,
        contamination=0.1,
        random_state=42
    )

    model.fit(X_scaled)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    
    # Save both model and scaler as a dictionary (compatible with our predict function)
    model_dict = {
        "model": model,
        "scaler": scaler,
        "is_fitted": True
    }
    joblib.dump(model_dict, MODEL_PATH)

    return model_dict


def load_model():
    return joblib.load(MODEL_PATH)


def predict_anomaly(model, X):
    if isinstance(model, dict):
        clf = model["model"]
        scaler = model.get("scaler")
        if scaler is not None:
            # Scale X using the trained scaler
            X = scaler.transform(X)
    else:
        clf = model

    scores = clf.decision_function(X)

    # Map decision function scores to [0, 1] anomaly scores
    # positive score -> [0, 0.5] (normal)
    # negative score -> [0.5, 1] (anomaly)
    # Using typical bounds [-0.5, 0.5] for Isolation Forest decision function
    anomaly_scores = []
    for s in scores:
        if s >= 0:
            val = 0.5 * (1.0 - min(s / 0.5, 1.0))
        else:
            val = 0.5 + 0.5 * min(abs(s) / 0.5, 1.0)
        anomaly_scores.append(val)

    return np.array(anomaly_scores)