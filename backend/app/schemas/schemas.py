"""DRISHTI-AI — Pydantic Schemas for API validation"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime


class IncidentBase(BaseModel):
    location: str
    state: Optional[str] = None
    district: Optional[str] = None
    disaster_type: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    affected_population: Optional[int] = 0


class IncidentCreate(IncidentBase):
    rainfall: Optional[float] = 50.0
    river_level: Optional[float] = 50.0
    population_density: Optional[float] = 50.0
    historical_disaster_freq: Optional[float] = 50.0
    infrastructure_vulnerability: Optional[float] = 50.0
    weather_severity: Optional[float] = 50.0
    distance_to_hospital: Optional[float] = 40.0
    road_accessibility: Optional[float] = 55.0


class IncidentResponse(BaseModel):
    id: int
    incident_id: str
    location: str
    state: Optional[str]
    district: Optional[str]
    disaster_type: str
    severity: Optional[str]
    status: str
    risk_score: float
    risk_category: Optional[str]
    probability: float
    affected_population: int
    latitude: Optional[float]
    longitude: Optional[float]
    description: Optional[str]
    ai_explanation: Optional[str]
    recommended_actions: Optional[List[str]]
    feature_contributions: Optional[Dict[str, float]]
    detected_at: datetime
    updated_at: datetime
    source: str
    report_count: int
    priority: str
    rainfall: float
    river_level: float
    population_density: float
    historical_disaster_freq: float
    infrastructure_vulnerability: float
    weather_severity: float
    distance_to_hospital: float
    road_accessibility: float

    class Config:
        from_attributes = True


class CitizenReportCreate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    disaster_type: str
    description: str = Field(..., min_length=10, max_length=2000)
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if v and len(v) > 20:
            raise ValueError("Phone number too long")
        return v


class CitizenReportResponse(BaseModel):
    id: int
    report_id: str
    name: Optional[str]
    disaster_type: str
    location: str
    status: str
    ai_classification: Optional[str]
    risk_score: Optional[float]
    risk_category: Optional[str]
    priority: Optional[str]
    incident_id: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class AnalyzeIncidentRequest(BaseModel):
    text: str = Field(..., min_length=10, max_length=5000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AnalyzeIncidentResponse(BaseModel):
    detected_hazard: str
    hazard_confidence: float
    affected_population: int
    severity: str
    urgency: str
    extracted_features: Dict[str, float]
    risk_score: float
    risk_category: str
    probability: float
    feature_contributions: Dict[str, float]
    ai_explanation: str
    recommended_actions: List[str]


class RiskCalculationRequest(BaseModel):
    rainfall: float = Field(50.0, ge=0, le=100)
    river_level: float = Field(50.0, ge=0, le=100)
    population_density: float = Field(50.0, ge=0, le=100)
    affected_population: float = Field(50.0, ge=0, le=100)
    historical_disaster_freq: float = Field(50.0, ge=0, le=100)
    infrastructure_vulnerability: float = Field(50.0, ge=0, le=100)
    weather_severity: float = Field(50.0, ge=0, le=100)
    distance_to_hospital: float = Field(40.0, ge=0, le=100)
    road_accessibility: float = Field(55.0, ge=0, le=100)


class WhatIfRequest(BaseModel):
    base_incident_id: Optional[str] = None
    base_features: Optional[Dict[str, float]] = None
    changes: Dict[str, float]


class ResponseTeamResponse(BaseModel):
    id: int
    team_id: str
    team_name: str
    team_type: str
    location: str
    state: Optional[str]
    status: str
    assigned_incident: Optional[str]
    eta_minutes: Optional[int]
    personnel_count: int
    capabilities: Optional[List[str]]
    contact: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]

    class Config:
        from_attributes = True


class AlertResponse(BaseModel):
    id: int
    alert_id: str
    incident_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    previous_risk: float
    current_risk: float
    change_reason: Optional[str]
    acknowledged: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsResponse(BaseModel):
    total_incidents: int
    critical_incidents: int
    high_incidents: int
    total_affected: int
    active_teams: int
    ai_confidence: float
    incidents_by_type: Dict[str, int]
    incidents_by_state: Dict[str, int]
    risk_trend: List[Dict[str, Any]]
    response_time_avg: float
    incidents_by_day: List[Dict[str, Any]]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)


class ChatResponse(BaseModel):
    response: str
    relevant_incidents: Optional[List[str]] = None
    data: Optional[Dict[str, Any]] = None
