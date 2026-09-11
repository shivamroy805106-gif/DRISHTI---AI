"""DRISHTI-AI — Citizen Reports Route"""
import os
import sys
import random
import string
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.database.db import get_db
from backend.app.models.models import CitizenReport, Incident
from backend.app.schemas.schemas import CitizenReportResponse

router = APIRouter(prefix="/api/citizen-report", tags=["citizen-reports"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def gen_report_id() -> str:
    return "RPT-" + "".join(random.choices(string.digits, k=6))


def find_duplicate_cluster(db: Session, disaster_type: str, lat: float, lon: float, threshold_km: float = 25.0):
    """Find existing incident cluster within threshold distance."""
    import math
    incidents = db.query(Incident).filter(
        Incident.disaster_type == disaster_type.lower(),
        Incident.status.in_(["ACTIVE", "MONITORING"]),
    ).all()

    for inc in incidents:
        if inc.latitude and inc.longitude and lat and lon:
            dlat = math.radians(lat - inc.latitude)
            dlon = math.radians(lon - inc.longitude)
            a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(inc.latitude)) * math.cos(math.radians(lat)) * math.sin(dlon / 2) ** 2
            dist_km = 6371 * 2 * math.asin(math.sqrt(a))
            if dist_km <= threshold_km:
                return inc
    return None


@router.post("", response_model=CitizenReportResponse, status_code=201)
async def submit_citizen_report(
    name: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    disaster_type: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if len(description) < 10:
        raise HTTPException(status_code=422, detail="Description too short")

    # Save image if provided
    image_path = None
    if image and image.filename:
        allowed = {".jpg", ".jpeg", ".png", ".webp"}
        ext = os.path.splitext(image.filename.lower())[1]
        if ext not in allowed:
            raise HTTPException(status_code=422, detail="Invalid image format. Use JPG, PNG, or WebP.")
        if image.size and image.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=422, detail="Image too large (max 10MB)")
        safe_filename = gen_report_id() + ext
        image_path = os.path.join(UPLOAD_DIR, safe_filename)
        with open(image_path, "wb") as f:
            content = await image.read()
            f.write(content)

    # AI analysis of description
    from ml.predict import analyze_text
    analysis = analyze_text(description)

    # Check for duplicate incident cluster
    existing_incident = None
    if latitude and longitude:
        existing_incident = find_duplicate_cluster(db, disaster_type, latitude, longitude)

    if existing_incident:
        # Increment report count and affected population
        existing_incident.report_count += 1
        existing_incident.affected_population += 500  # Assume each report indicates 500 more affected people

        # Recalculate risk based on new population
        from ml.predict import predict_risk, _generate_explanation
        features = {
            "rainfall": existing_incident.rainfall,
            "river_level": existing_incident.river_level,
            "population_density": existing_incident.population_density,
            "affected_population": min(100, existing_incident.affected_population / 100),
            "historical_disaster_freq": existing_incident.historical_disaster_freq,
            "infrastructure_vulnerability": existing_incident.infrastructure_vulnerability,
            "weather_severity": existing_incident.weather_severity,
            "distance_to_hospital": existing_incident.distance_to_hospital,
            "road_accessibility": existing_incident.road_accessibility,
        }
        new_risk = predict_risk(features)
        
        # Check if risk escalated
        old_risk_score = existing_incident.risk_score
        if new_risk["risk_score"] > old_risk_score:
            existing_incident.risk_score = new_risk["risk_score"]
            existing_incident.risk_category = new_risk["risk_category"]
            existing_incident.severity = new_risk["risk_category"]
            existing_incident.ai_explanation = _generate_explanation(existing_incident.disaster_type, new_risk, features, existing_incident.affected_population)
            existing_incident.priority = "P1" if new_risk["risk_category"] == "CRITICAL" else "P2" if new_risk["risk_category"] == "HIGH" else "P3"
            
            # Create an escalation alert
            from backend.app.models.models import Alert
            alert = Alert(
                alert_id=gen_report_id().replace("RPT", "ALT"),
                incident_id=existing_incident.incident_id,
                alert_type="RISK_ESCALATION",
                severity=new_risk["risk_category"],
                title=f"Risk Escalated due to Citizen Reports — {existing_incident.location}",
                message=f"Incident risk increased due to surge in citizen reports. Now affecting ~{existing_incident.affected_population} people.",
                previous_risk=old_risk_score,
                current_risk=new_risk["risk_score"],
                change_reason="Surge in citizen reports clustered to this incident."
            )
            db.add(alert)

        db.commit()
        incident_id = existing_incident.incident_id
        is_duplicate = True
    else:
        incident_id = None
        is_duplicate = False

    report = CitizenReport(
        report_id=gen_report_id(),
        name=name,
        phone=phone,
        disaster_type=disaster_type.lower(),
        description=description,
        location=location,
        latitude=latitude,
        longitude=longitude,
        image_path=image_path,
        ai_classification=analysis["detected_hazard"],
        risk_score=analysis["risk_score"],
        risk_category=analysis["risk_category"],
        priority="P1" if analysis["risk_category"] in ["CRITICAL"] else "P2" if analysis["risk_category"] == "HIGH" else "P3",
        incident_id=incident_id,
        status="CLUSTERED" if is_duplicate else "PENDING",
        analyzed_at=datetime.utcnow(),
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("", response_model=List[CitizenReportResponse])
def get_reports(
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(CitizenReport)
    if status:
        q = q.filter(CitizenReport.status == status.upper())
    return q.order_by(CitizenReport.submitted_at.desc()).limit(limit).all()


@router.get("/stats")
def report_stats(db: Session = Depends(get_db)):
    total = db.query(CitizenReport).count()
    pending = db.query(CitizenReport).filter(CitizenReport.status == "PENDING").count()
    clustered = db.query(CitizenReport).filter(CitizenReport.status == "CLUSTERED").count()
    return {"total": total, "pending": pending, "clustered": clustered}
