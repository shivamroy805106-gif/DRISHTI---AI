"""
DRISHTI-AI — Risk Model Training Script
Trains a RandomForest model on synthetic disaster risk data.
Also trains a regression model to predict exact risk scores.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, mean_absolute_error, r2_score
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.dataset_generator import generate_dataset

FEATURES = [
    "rainfall",
    "river_level",
    "population_density",
    "affected_population",
    "historical_disaster_freq",
    "infrastructure_vulnerability",
    "weather_severity",
    "distance_to_hospital",
    "road_accessibility",
]

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


def train():
    print("🔄 Generating synthetic training dataset...")
    df = generate_dataset()

    X = df[FEATURES].values
    y_class = df["risk_category"].values
    y_reg = df["risk_score"].values

    X_train, X_test, yc_train, yc_test, yr_train, yr_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42
    )

    # ── Classifier ───────────────────────────────────────────────
    print("🧠 Training Risk Category Classifier (RandomForest)...")
    clf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        min_samples_split=4,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, yc_train)
    yc_pred = clf.predict(X_test)
    classes_present = sorted(set(yc_train))
    target_names = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    present_names = [target_names[c] for c in classes_present]
    print("\nClassification Report:")
    print(classification_report(yc_test, yc_pred, labels=classes_present, target_names=present_names))

    cv_scores = cross_val_score(clf, X, y_class, cv=5, scoring="accuracy")
    print(f"Cross-val accuracy: {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # ── Regressor ────────────────────────────────────────────────
    print("\n📊 Training Risk Score Regressor (GradientBoosting)...")
    reg = GradientBoostingRegressor(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
    )
    reg.fit(X_train, yr_train)
    yr_pred = reg.predict(X_test)
    mae = mean_absolute_error(yr_test, yr_pred)
    r2 = r2_score(yr_test, yr_pred)
    print(f"MAE: {mae:.2f}  |  R²: {r2:.3f}")

    # ── Feature importance ───────────────────────────────────────
    importances = clf.feature_importances_
    feat_importance = dict(zip(FEATURES, [round(float(v), 4) for v in importances]))
    print("\nFeature Importances:")
    for f, imp in sorted(feat_importance.items(), key=lambda x: -x[1]):
        print(f"  {f}: {imp:.4f}")

    # ── Save models ───────────────────────────────────────────────
    clf_path = os.path.join(MODELS_DIR, "risk_classifier.joblib")
    reg_path = os.path.join(MODELS_DIR, "risk_regressor.joblib")
    fi_path  = os.path.join(MODELS_DIR, "feature_importance.joblib")

    joblib.dump(clf, clf_path)
    joblib.dump(reg, reg_path)
    joblib.dump(feat_importance, fi_path)

    print(f"\n✅ Models saved:")
    print(f"   {clf_path}")
    print(f"   {reg_path}")
    print(f"   {fi_path}")
    return clf, reg, feat_importance


if __name__ == "__main__":
    train()
