"""
DRISHTI-AI — SQLAlchemy Database Models
"""
from sqlalchemy import Column, Integer, Float, String, Text, DateTime, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(20), unique=True, index=True)
    location = Column(String(200), nullable=False)
    state = Column(String(100))
    district = Column(String(100))
    disaster_type = Column(String(50), nullable=False)
    severity = Column(String(20))
    status = Column(String(20), default="ACTIVE")
    risk_score = Column(Float, default=0.0)
    risk_category = Column(String(20))
    probability = Column(Float, default=0.0)
    affected_population = Column(Integer, default=0)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(Text)
    ai_explanation = Column(Text)
    recommended_actions = Column(JSON)
    feature_contributions = Column(JSON)
    detected_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    source = Column(String(50), default="system")
    report_count = Column(Integer, default=1)
    rainfall = Column(Float, default=50.0)
    river_level = Column(Float, default=50.0)
    population_density = Column(Float, default=50.0)
    historical_disaster_freq = Column(Float, default=50.0)
    infrastructure_vulnerability = Column(Float, default=50.0)
    weather_severity = Column(Float, default=50.0)
    distance_to_hospital = Column(Float, default=40.0)
    road_accessibility = Column(Float, default=55.0)
    priority = Column(String(5), default="P3")


class CitizenReport(Base):
    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String(20), unique=True, index=True)
    name = Column(String(100))
    phone = Column(String(20))
    disaster_type = Column(String(50))
    description = Column(Text, nullable=False)
    location = Column(String(200))
    latitude = Column(Float)
    longitude = Column(Float)
    image_path = Column(String(300))
    ai_classification = Column(String(50))
    risk_score = Column(Float)
    risk_category = Column(String(20))
    priority = Column(String(10))
    incident_id = Column(String(20))
    status = Column(String(20), default="PENDING")
    submitted_at = Column(DateTime, default=datetime.utcnow)
    analyzed_at = Column(DateTime)


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(20), index=True)
    risk_score = Column(Float)
    risk_category = Column(String(20))
    probability = Column(Float)
    features = Column(JSON)
    contributions = Column(JSON)
    predicted_at = Column(DateTime, default=datetime.utcnow)


class ResponseTeam(Base):
    __tablename__ = "response_teams"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(String(20), unique=True)
    team_name = Column(String(100))
    team_type = Column(String(50))
    location = Column(String(200))
    state = Column(String(100))
    status = Column(String(20), default="AVAILABLE")
    assigned_incident = Column(String(20))
    eta_minutes = Column(Integer)
    personnel_count = Column(Integer, default=10)
    capabilities = Column(JSON)
    contact = Column(String(50))
    latitude = Column(Float)
    longitude = Column(Float)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(20), unique=True)
    incident_id = Column(String(20), index=True)
    alert_type = Column(String(30))
    severity = Column(String(20))
    title = Column(String(200))
    message = Column(Text)
    previous_risk = Column(Float)
    current_risk = Column(Float)
    change_reason = Column(Text)
    acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    state = Column(String(100))
    district = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    population = Column(Integer)
    vulnerability_score = Column(Float)
    historical_risk = Column(Float)
    flood_prone = Column(Boolean, default=False)
    cyclone_prone = Column(Boolean, default=False)
    earthquake_prone = Column(Boolean, default=False)
