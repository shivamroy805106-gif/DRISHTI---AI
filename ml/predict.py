"""
DRISHTI-AI — Risk Prediction Engine
Provides risk scoring, feature explanations, and NLP analysis.
"""

import os
import re
import math
import joblib
import numpy as np
from typing import Dict, Any, Optional, List

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
CATEGORY_LABELS = {0: "LOW", 1: "MEDIUM", 2: "HIGH", 3: "CRITICAL"}
CATEGORY_COLORS = {0: "#22c55e", 1: "#eab308", 2: "#f97316", 3: "#ef4444"}


def _load_models():
    clf_path = os.path.join(MODELS_DIR, "risk_classifier.joblib")
    reg_path = os.path.join(MODELS_DIR, "risk_regressor.joblib")
    fi_path  = os.path.join(MODELS_DIR, "feature_importance.joblib")

    if not os.path.exists(clf_path):
        # Auto-train if models don't exist
        from ml.train import train
        train()

    clf = joblib.load(clf_path)
    reg = joblib.load(reg_path)
    fi  = joblib.load(fi_path)
    return clf, reg, fi


_clf, _reg, _feat_importance = None, None, None


def get_models():
    global _clf, _reg, _feat_importance
    if _clf is None:
        _clf, _reg, _feat_importance = _load_models()
    return _clf, _reg, _feat_importance


def predict_risk(features: Dict[str, float]) -> Dict[str, Any]:
    """
    Predict risk score, category, probability and feature contributions.
    Features dict keys: rainfall, river_level, population_density,
    affected_population, historical_disaster_freq, infrastructure_vulnerability,
    weather_severity, distance_to_hospital, road_accessibility
    All values should be 0–100 (normalized).
    """
    clf, reg, feat_imp = get_models()

    X = np.array([[features.get(f, 50.0) for f in FEATURES]])

    # Score
    risk_score = float(np.clip(reg.predict(X)[0], 0, 100))

    # Category
    cat_idx = int(clf.predict(X)[0])
    cat_label = CATEGORY_LABELS[cat_idx]

    # Probabilities
    proba = clf.predict_proba(X)[0]
    max_proba = float(max(proba))

    # Feature contributions (weighted by importance × feature value)
    contributions = {}
    total_weight = sum(feat_imp.values())
    for feat in FEATURES:
        val = features.get(feat, 50.0)
        imp = feat_imp.get(feat, 0.1)
        # Contribution = (feature_importance / total_weight) * (feature_value / 100) * 100
        contrib = (imp / total_weight) * (val / 100) * risk_score
        contributions[feat] = round(contrib, 1)

    # Scale contributions to sum to risk_score
    total_contrib = sum(contributions.values())
    if total_contrib > 0:
        scale = risk_score / total_contrib
        contributions = {k: round(v * scale, 1) for k, v in contributions.items()}

    # Top contributing features
    sorted_contrib = sorted(contributions.items(), key=lambda x: -x[1])

    return {
        "risk_score": round(risk_score, 1),
        "risk_category": cat_label,
        "risk_category_index": cat_idx,
        "probability": round(max_proba * 100, 1),
        "ai_confidence": round(max_proba * 100, 1),
        "feature_contributions": contributions,
        "top_features": sorted_contrib[:5],
        "color": CATEGORY_COLORS[cat_idx],
    }


# ── NLP / Text Analysis ──────────────────────────────────────────────────────

HAZARD_KEYWORDS = {
    "flood": ["flood", "flooding", "inundation", "waterlog", "submerged", "overflow", "deluge",
              "river risen", "water level", "heavy rain", "rainfall", "cloudburst"],
    "fire":  ["fire", "blaze", "wildfire", "burning", "smoke", "flame", "arson", "forest fire",
              "building fire", "inferno"],
    "cyclone": ["cyclone", "hurricane", "typhoon", "storm", "gale", "wind speed", "tropical storm"],
    "landslide": ["landslide", "mudslide", "rockfall", "debris", "slope failure", "soil erosion",
                  "mountain", "hillside collapse"],
    "earthquake": ["earthquake", "tremor", "seismic", "quake", "aftershock", "richter", "magnitude"],
    "drought": ["drought", "water scarcity", "dry spell", "crop failure", "famine", "water shortage"],
    "accident": ["accident", "crash", "collision", "explosion", "industrial", "chemical spill",
                 "gas leak", "blast"],
    "heatwave": ["heatwave", "heat wave", "extreme heat", "temperature soaring", "hot wave"],
}

SEVERITY_PATTERNS = [
    (r"\b(catastrophic|massive|devastating|severe|extreme|critical|emergency)\b", "CRITICAL", 90),
    (r"\b(major|serious|significant|dangerous|urgent|grave)\b", "HIGH", 70),
    (r"\b(moderate|considerable|notable|alarming)\b", "MEDIUM", 45),
    (r"\b(minor|small|low|limited)\b", "LOW", 20),
]

POPULATION_PATTERN = re.compile(
    r"(\d[\d,]*)\s*(?:people|persons?|residents?|villagers?|families|households|lives|affected|displaced)",
    re.IGNORECASE,
)

LOCATION_INDICATORS = [
    r"in\s+([A-Z][a-zA-Z\s]+(?:district|village|town|city|block|tehsil|zone|area|region|state)?)",
    r"at\s+([A-Z][a-zA-Z\s]+)",
    r"near\s+([A-Z][a-zA-Z\s]+)",
    r"([A-Z][a-zA-Z]+,\s*[A-Z][a-zA-Z]+)",
]

URGENCY_WORDS = {
    "immediate": ["immediately", "urgent", "emergency", "critical", "now", "asap"],
    "high": ["rapidly", "quickly", "fast", "soon", "hours"],
    "medium": ["today", "current", "ongoing"],
    "low": ["slow", "gradual", "monitoring"],
}


def analyze_text(text: str) -> Dict[str, Any]:
    """
    NLP analysis of incident text.
    Returns hazard type, extracted location, population, severity, urgency.
    """
    text_lower = text.lower()

    # Hazard detection
    hazard_scores = {}
    for hazard, keywords in HAZARD_KEYWORDS.items():
        score = sum(3 if kw in text_lower else 0 for kw in keywords if len(kw) > 4)
        score += sum(1 if kw in text_lower else 0 for kw in keywords if len(kw) <= 4)
        if score > 0:
            hazard_scores[hazard] = score
    detected_hazard = max(hazard_scores, key=hazard_scores.get) if hazard_scores else "unknown"

    # Population extraction
    pop_match = POPULATION_PATTERN.search(text)
    affected_population = 0
    if pop_match:
        affected_population = int(pop_match.group(1).replace(",", ""))

    # Severity detection
    detected_severity = "MEDIUM"
    severity_score = 45
    for pattern, sev, score in SEVERITY_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            detected_severity = sev
            severity_score = score
            break

    # Urgency
    detected_urgency = "medium"
    for urgency, words in URGENCY_WORDS.items():
        if any(w in text_lower for w in words):
            detected_urgency = urgency
            break

    # Rainfall/river level extraction
    rainfall = 60 if any(w in text_lower for w in ["heavy rain", "rainfall", "downpour", "cloudburst"]) else 30
    if "light rain" in text_lower:
        rainfall = 20
    if "very heavy" in text_lower or "extremely heavy" in text_lower:
        rainfall = 90

    river_level = 80 if any(w in text_lower for w in ["river risen", "water level", "flooding", "overflow"]) else 40

    # Build feature vector for risk scoring
    pop_normalized = min(100, affected_population / 10) if affected_population > 0 else 50
    features = {
        "rainfall": rainfall,
        "river_level": river_level if detected_hazard == "flood" else 20,
        "population_density": 60,  # default moderate
        "affected_population": pop_normalized,
        "historical_disaster_freq": 55,
        "infrastructure_vulnerability": 50,
        "weather_severity": severity_score,
        "distance_to_hospital": 40,
        "road_accessibility": 55,
    }

    risk_result = predict_risk(features)

    return {
        "detected_hazard": detected_hazard,
        "hazard_confidence": round(min(100, (hazard_scores.get(detected_hazard, 1) / max(1, sum(hazard_scores.values()))) * 100), 1),
        "affected_population": affected_population,
        "severity": detected_severity,
        "urgency": detected_urgency,
        "extracted_features": features,
        "risk_score": risk_result["risk_score"],
        "risk_category": risk_result["risk_category"],
        "probability": risk_result["probability"],
        "feature_contributions": risk_result["feature_contributions"],
        "ai_explanation": _generate_explanation(detected_hazard, risk_result, features, affected_population),
        "recommended_actions": _get_recommendations(detected_hazard, risk_result["risk_category"], affected_population),
    }


def _generate_explanation(hazard: str, risk: Dict, features: Dict, pop: int) -> str:
    score = risk["risk_score"]
    cat = risk["risk_category"]
    pop_str = f" with approximately {pop:,} people directly affected" if pop > 0 else ""

    base = f"{hazard.title()} risk at {cat} level (score: {score:.0f}/100){pop_str}. "

    factors = []
    if features["rainfall"] > 70:
        factors.append("heavy rainfall")
    if features["river_level"] > 70:
        factors.append("rapidly rising river levels")
    if features["population_density"] > 60:
        factors.append("high population exposure")
    if features["infrastructure_vulnerability"] > 60:
        factors.append("vulnerable infrastructure")
    if features["distance_to_hospital"] > 60:
        factors.append("limited medical access")

    if factors:
        base += f"Key contributing factors include {', '.join(factors)}. "

    if cat == "CRITICAL":
        base += "Immediate emergency response required. All available resources should be mobilized."
    elif cat == "HIGH":
        base += "Urgent response needed. Priority deployment of emergency teams recommended."
    elif cat == "MEDIUM":
        base += "Active monitoring and preparatory response advised."
    else:
        base += "Situation under observation. Routine monitoring protocols apply."

    return base


def _get_recommendations(hazard: str, category: str, population: int) -> List[str]:
    base_recs = {
        "CRITICAL": [
            "Issue immediate public warning and evacuation order",
            "Deploy NDRF/SDRF emergency response teams",
            "Activate emergency operations center",
            "Establish relief camps in designated safe zones",
            "Coordinate with district administration for resource mobilization",
            "Ensure continuous monitoring every 30 minutes",
            "Alert medical teams and pre-position ambulances",
        ],
        "HIGH": [
            "Issue public advisory and preparedness warning",
            "Pre-position emergency response teams",
            "Activate standby relief camps",
            "Alert medical facilities in the area",
            "Increase monitoring frequency to hourly updates",
            "Identify and prepare evacuation routes",
        ],
        "MEDIUM": [
            "Issue awareness advisory to local residents",
            "Place emergency teams on standby alert",
            "Inspect critical infrastructure for vulnerabilities",
            "Monitor situation every 2 hours",
            "Coordinate with local authorities for preparedness",
        ],
        "LOW": [
            "Continue routine monitoring",
            "Maintain situational awareness",
            "Update risk assessment within 24 hours",
            "Ensure emergency contacts are available",
        ],
    }

    recs = base_recs.get(category, base_recs["MEDIUM"]).copy()

    if hazard == "flood":
        recs.insert(1, "Monitor river gauge levels continuously")
    elif hazard == "fire":
        recs.insert(1, "Deploy fire suppression teams immediately")
    elif hazard == "cyclone":
        recs.insert(1, "Secure coastal communities and fishing vessels")
    elif hazard == "earthquake":
        recs.insert(1, "Conduct rapid structural safety assessment")
    elif hazard == "landslide":
        recs.insert(1, "Close vulnerable mountain roads and highways")

    if population > 1000:
        recs.append(f"Large-scale evacuation plan needed for {population:,}+ affected people")

    return recs[:8]


def calculate_what_if(base_features: Dict[str, float], changes: Dict[str, float]) -> Dict[str, Any]:
    """Recalculate risk with modified feature values (for What-If simulator)."""
    new_features = base_features.copy()
    for key, delta in changes.items():
        if key in new_features:
            new_features[key] = float(np.clip(new_features[key] + delta, 0, 100))
    return predict_risk(new_features)
