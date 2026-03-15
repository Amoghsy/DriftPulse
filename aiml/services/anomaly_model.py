from sklearn.ensemble import IsolationForest
import joblib
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "anomaly_model.pkl")

def train_model(X):

    model = IsolationForest(
        n_estimators=500,
        contamination=0.1,
        random_state=42
    )

    model.fit(X)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return model


def load_model():

    return joblib.load(MODEL_PATH)


def predict_anomaly(model, X):

    scores = model.decision_function(X)

    anomaly_scores = abs(scores)

    return anomaly_scores