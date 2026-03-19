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
    return joblib.load(MODEL_PATH)


def predict(features):
    model = load_model()
    prob = model.predict_proba([features])[0][1]
    return prob
