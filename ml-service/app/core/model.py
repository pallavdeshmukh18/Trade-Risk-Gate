from sklearn.linear_model import LogisticRegression
import joblib
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parents[2] / "model.pkl"


def train_model(X, y):
    model = LogisticRegression()
    model.fit(X, y)

    joblib.dump(model, MODEL_PATH)
    print("✅ Model saved")


def load_model():
    if not MODEL_PATH.exists():
        print("Error:", f"Model file not found at {MODEL_PATH}")
        return None

    try:
        return joblib.load(MODEL_PATH)
    except Exception as exc:
        print("Error:", str(exc))
        return None


def predict(features):
    model = load_model()
    if model is None:
        return None

    prob = model.predict_proba([features])[0][1]
    return prob
