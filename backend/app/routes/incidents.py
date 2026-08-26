"""DRISHTI-AI — Incidents API Routes"""
import os
import sys
import string
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.database.db import get_db
from backend.app.models.models import Incident
from backend.app.schemas.schemas import IncidentCreate, IncidentResponse

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


def generate_incident_id(disaster_type: str, state: str = "") -> str:
    prefix = {
        "flood": "FLD", "fire": "FIRE", "cyclone": "CYC", "landslide": "LSL",
        "earthquake": "EQK", "drought": "DRT", "accident": "ACC", "heatwave": "HW",
    }.get(disaster_type.lower(), "INC")
    state_abbr = state[:3].upper() if state else "UNK"
    num = ''.join(random.choices(string.digits, k=3))
    return f"{state_abbr}-{prefix}-{num}"


@router.get("", response_model=List[IncidentResponse])
def get_incidents(
    disaster_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Incident)
    if disaster_type:
        q = q.filter(Incident.disaster_type == disaster_type.lower())
    if severity:
        q = q.filter(Incident.severity == severity.upper())
    if status:
        q = q.filter(Incident.status == status.upper())
    if state:
        q = q.filter(Incident.state == state)
    if priority:
        q = q.filter(Incident.priority == priority.upper())
    return q.order_by(Incident.risk_score.desc()).limit(limit).all()


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")
    return inc


@router.post("", response_model=IncidentResponse, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    from ml.predict import predict_risk, _generate_explanation, _get_recommendations
    features = {
        "rainfall": payload.rainfall,
        "river_level": payload.river_level,
        "population_density": payload.population_density,
        "affected_population": min(100, (payload.affected_population or 0) / 100),
        "historical_disaster_freq": payload.historical_disaster_freq,
        "infrastructure_vulnerability": payload.infrastructure_vulnerability,
        "weather_severity": payload.weather_severity,
        "distance_to_hospital": payload.distance_to_hospital,
        "road_accessibility": payload.road_accessibility,
    }
    risk = predict_risk(features)
    cat = risk["risk_category"]
    score = risk["risk_score"]

    priority = "P1" if cat == "CRITICAL" else "P2" if cat == "HIGH" else "P3"
    severity = cat

    inc = Incident(
        incident_id=generate_incident_id(payload.disaster_type, payload.state or ""),
        location=payload.location,
        state=payload.state,
        district=payload.district,
        disaster_type=payload.disaster_type.lower(),
        severity=severity,
        status="ACTIVE",
        risk_score=score,
        risk_category=cat,
        probability=risk["probability"],
        affected_population=payload.affected_population or 0,
        latitude=payload.latitude,
        longitude=payload.longitude,
        description=payload.description,
        ai_explanation=_generate_explanation(payload.disaster_type, risk, features, payload.affected_population or 0),
        recommended_actions=_get_recommendations(payload.disaster_type, cat, payload.affected_population or 0),
        feature_contributions=risk["feature_contributions"],
        rainfall=payload.rainfall,
        river_level=payload.river_level,
        population_density=payload.population_density,
        historical_disaster_freq=payload.historical_disaster_freq,
        infrastructure_vulnerability=payload.infrastructure_vulnerability,
        weather_severity=payload.weather_severity,
        distance_to_hospital=payload.distance_to_hospital,
        road_accessibility=payload.road_accessibility,
        priority=priority,
        source="api",
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)
    return inc


@router.patch("/{incident_id}/status")
def update_incident_status(
    incident_id: str,
    status: str = Query(..., pattern="^(ACTIVE|RESOLVED|MONITORING|CLOSED)$"),
    db: Session = Depends(get_db),
):
    inc = db.query(Incident).filter(Incident.incident_id == incident_id).first()
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")
    inc.status = status.upper()
    inc.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Incident {incident_id} status updated to {status}"}
