"""DRISHTI-AI — AI Analysis, Risk Calculation, What-If Routes"""
import os
import sys

from fastapi import APIRouter, HTTPException

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.schemas.schemas import (
    AnalyzeIncidentRequest, AnalyzeIncidentResponse,
    RiskCalculationRequest, WhatIfRequest,
)

router = APIRouter(prefix="/api", tags=["ai-analysis"])


@router.post("/analyze-incident", response_model=AnalyzeIncidentResponse)
def analyze_incident(payload: AnalyzeIncidentRequest):
    """
    AI/NLP analysis of free-text incident report.
    Extracts hazard, population, severity, and calculates risk.
    """
    try:
        from ml.predict import analyze_text
        result = analyze_text(payload.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/calculate-risk")
def calculate_risk(payload: RiskCalculationRequest):
    """
    Calculate risk score from structured feature inputs.
    """
    try:
        from ml.predict import predict_risk
        features = payload.model_dump()
        result = predict_risk(features)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk calculation failed: {str(e)}")


@router.post("/what-if")
def what_if_simulation(payload: WhatIfRequest):
    """
    What-If Disaster Simulator: recalculate risk with modified features.
    """
    try:
        from ml.predict import predict_risk, calculate_what_if
        from backend.app.database.db import SessionLocal
        from backend.app.models.models import Incident

        base_features = {}

        if payload.base_incident_id:
            db = SessionLocal()
            try:
                inc = db.query(Incident).filter(
                    Incident.incident_id == payload.base_incident_id
                ).first()
                if inc:
                    base_features = {
                        "rainfall": inc.rainfall,
                        "river_level": inc.river_level,
                        "population_density": inc.population_density,
                        "affected_population": inc.affected_population,
                        "historical_disaster_freq": inc.historical_disaster_freq,
                        "infrastructure_vulnerability": inc.infrastructure_vulnerability,
                        "weather_severity": inc.weather_severity,
                        "distance_to_hospital": inc.distance_to_hospital,
                        "road_accessibility": inc.road_accessibility,
                    }
            finally:
                db.close()

        if payload.base_features:
            base_features.update(payload.base_features)

        if not base_features:
            base_features = {k: 50.0 for k in [
                "rainfall", "river_level", "population_density", "affected_population",
                "historical_disaster_freq", "infrastructure_vulnerability",
                "weather_severity", "distance_to_hospital", "road_accessibility",
            ]}

        original = predict_risk(base_features)
        modified = calculate_what_if(base_features, payload.changes)

        return {
            "original": original,
            "modified": modified,
            "delta_score": round(modified["risk_score"] - original["risk_score"], 1),
            "base_features": base_features,
            "modified_features": {
                k: round(min(100, max(0, base_features.get(k, 50) + payload.changes.get(k, 0))), 1)
                for k in base_features
            },
            "changes_applied": payload.changes,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-if simulation failed: {str(e)}")
