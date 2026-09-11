"""DRISHTI-AI — Alerts, Response Teams, Analytics, and AI Chat Routes"""
import os
import sys
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app.database.db import get_db
from backend.app.models.models import Alert, ResponseTeam, Incident
from backend.app.schemas.schemas import AlertResponse, ResponseTeamResponse, ChatRequest, ChatResponse

alerts_router = APIRouter(prefix="/api/alerts", tags=["alerts"])
teams_router = APIRouter(prefix="/api/response-teams", tags=["response-teams"])
analytics_router = APIRouter(prefix="/api/analytics", tags=["analytics"])
chat_router = APIRouter(prefix="/api/chat", tags=["chat"])


# ── Alerts ────────────────────────────────────────────────────────────────────

@alerts_router.get("", response_model=List[AlertResponse])
def get_alerts(
    acknowledged: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    q = db.query(Alert)
    if acknowledged is not None:
        q = q.filter(Alert.acknowledged == acknowledged)
    if severity:
        q = q.filter(Alert.severity == severity.upper())
    return q.order_by(Alert.created_at.desc()).limit(limit).all()


@alerts_router.patch("/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        return {"error": "Alert not found"}
    alert.acknowledged = True
    db.commit()
    return {"message": f"Alert {alert_id} acknowledged"}


# ── Response Teams ────────────────────────────────────────────────────────────

@teams_router.get("", response_model=List[ResponseTeamResponse])
def get_teams(
    status: Optional[str] = Query(None),
    team_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(ResponseTeam)
    if status:
        q = q.filter(ResponseTeam.status == status.upper())
    if team_type:
        q = q.filter(ResponseTeam.team_type == team_type)
    return q.order_by(ResponseTeam.status).all()


@teams_router.patch("/{team_id}/assign")
def assign_team(team_id: str, incident_id: str = Query(...), eta: int = Query(60), db: Session = Depends(get_db)):
    team = db.query(ResponseTeam).filter(ResponseTeam.team_id == team_id).first()
    if not team:
        return {"error": "Team not found"}
    team.status = "DEPLOYED"
    team.assigned_incident = incident_id
    team.eta_minutes = eta
    db.commit()
    return {"message": f"Team {team_id} assigned to {incident_id}"}


# ── Analytics ─────────────────────────────────────────────────────────────────

@analytics_router.get("")
def get_analytics(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db),
):
    since = datetime.utcnow() - timedelta(days=days)
    incidents = db.query(Incident).all()

    total = len(incidents)
    critical = sum(1 for i in incidents if i.risk_category == "CRITICAL")
    high = sum(1 for i in incidents if i.risk_category == "HIGH")
    total_affected = sum(i.affected_population for i in incidents)

    # By type
    by_type = {}
    for inc in incidents:
        by_type[inc.disaster_type] = by_type.get(inc.disaster_type, 0) + 1

    # By state
    by_state = {}
    for inc in incidents:
        if inc.state:
            by_state[inc.state] = by_state.get(inc.state, 0) + 1

    # Risk trend (last 7 days simulated)
    risk_trend = []
    for d in range(days, 0, -1):
        date = (datetime.utcnow() - timedelta(days=d)).strftime("%Y-%m-%d")
        avg_risk = random.uniform(55, 85) + random.gauss(0, 5)
        risk_trend.append({"date": date, "avg_risk": round(min(100, max(0, avg_risk)), 1)})

    # Incidents by day
    by_day = []
    for d in range(min(days, 14), 0, -1):
        date = (datetime.utcnow() - timedelta(days=d)).strftime("%Y-%m-%d")
        by_day.append({
            "date": date,
            "flood": random.randint(1, 5),
            "fire": random.randint(0, 2),
            "cyclone": random.randint(0, 1),
            "landslide": random.randint(0, 2),
            "earthquake": random.randint(0, 1),
            "other": random.randint(0, 2),
        })

    teams = db.query(ResponseTeam).all()
    active_teams = sum(1 for t in teams if t.status == "DEPLOYED")
    avg_confidence = round(sum(i.probability for i in incidents) / max(1, total), 1)

    return {
        "summary": {
            "total_incidents": total,
            "critical_incidents": critical,
            "high_incidents": high,
            "total_affected": total_affected,
            "active_teams": active_teams,
            "ai_confidence": avg_confidence,
        },
        "incidents_by_type": by_type,
        "incidents_by_state": by_state,
        "risk_trend": risk_trend,
        "incidents_by_day": by_day,
        "response_time_avg": 42.5,
    }


# ── AI Chat ───────────────────────────────────────────────────────────────────

@chat_router.post("", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    """
    DRISHTI Intelligence AI Assistant.
    Answers questions about current incidents using application data.
    """
    msg = payload.message.lower().strip()
    incidents = db.query(Incident).order_by(Incident.risk_score.desc()).all()
    teams = db.query(ResponseTeam).all()

    if not incidents:
        return ChatResponse(response="No incident data available at the moment.")

    top = incidents[0]
    critical_incs = [i for i in incidents if i.risk_category == "CRITICAL"]
    total_affected = sum(i.affected_population for i in incidents)

    # Pattern matching responses
    if any(w in msg for w in ["immediate", "urgent", "now", "priority", "p1", "first"]):
        p1 = [i for i in incidents if i.priority == "P1"]
        if p1:
            names = ", ".join(f"{i.incident_id} ({i.location})" for i in p1[:3])
            return ChatResponse(
                response=f"🔴 **P1 Immediate Response Required:**\n\n{names}\n\nTop priority: **{p1[0].incident_id}** in {p1[0].location} with risk score **{p1[0].risk_score}/100**. {p1[0].ai_explanation}",
                relevant_incidents=[i.incident_id for i in p1[:3]],
            )

    # Dynamic Location Search
    found_inc = None
    for inc in incidents:
        loc = (inc.location or "").lower()
        state = (inc.state or "").lower()
        # Ensure location string is at least 3 chars to avoid false positive matches on short words
        if (loc and len(loc) >= 3 and loc in msg) or (state and len(state) >= 3 and state in msg):
            found_inc = inc
            break

    if found_inc:
        return ChatResponse(
            response=f"📍 **{found_inc.location}** — Risk Score: **{found_inc.risk_score}/100** ({found_inc.risk_category})\n\n{found_inc.ai_explanation}\n\nKey factors: Rainfall {found_inc.rainfall}%, River level {found_inc.river_level}%, Population density {found_inc.population_density}%.",
            relevant_incidents=[found_inc.incident_id],
        )

    if any(w in msg for w in ["risk", "people", "affected", "how many"]):
        return ChatResponse(
            response=f"📊 **Current Status:**\n- Total incidents: {len(incidents)}\n- Critical: {len(critical_incs)}\n- Total people at risk: **{total_affected:,}**\n- Highest risk: {top.location} ({top.risk_score}/100)\n- Active teams deployed: {sum(1 for t in teams if t.status == 'DEPLOYED')}",
            data={"total_affected": total_affected, "critical_count": len(critical_incs)},
        )

    if any(w in msg for w in ["rainfall", "rain", "increase", "what if", "simulator"]):
        from ml.predict import predict_risk
        features = {
            "rainfall": min(100, (top.rainfall or 50) + 30),
            "river_level": min(100, (top.river_level or 50) + 20),
            "population_density": top.population_density or 50,
            "affected_population": min(100, top.affected_population / 100) if top.affected_population else 50,
            "historical_disaster_freq": top.historical_disaster_freq or 50,
            "infrastructure_vulnerability": top.infrastructure_vulnerability or 50,
            "weather_severity": min(100, (top.weather_severity or 50) + 15),
            "distance_to_hospital": top.distance_to_hospital or 40,
            "road_accessibility": top.road_accessibility or 55,
        }
        result = predict_risk(features)
        return ChatResponse(
            response=f"🌧️ **What-If: +30% Rainfall in {top.location}**\n\nCurrent risk: **{top.risk_score}/100** ({top.risk_category})\nProjected risk: **{result['risk_score']}/100** ({result['risk_category']})\n\nIncrease of **+{result['risk_score']-top.risk_score:.0f} points** — the situation would become significantly more dangerous.",
            relevant_incidents=[top.incident_id],
        )

    if any(w in msg for w in ["team", "ndrf", "response", "deployed"]):
        deployed = [t for t in teams if t.status == "DEPLOYED"]
        available = [t for t in teams if t.status == "AVAILABLE"]
        return ChatResponse(
            response=f"🚨 **Response Teams Status:**\n- Deployed: **{len(deployed)}** teams\n- Available: **{len(available)}** teams\n- Currently deployed to: {', '.join(t.assigned_incident or 'N/A' for t in deployed[:4])}",
            data={"deployed": len(deployed), "available": len(available)},
        )

    if any(w in msg for w in ["cyclone", "storm", "hurricane"]):
        cyclones = [i for i in incidents if i.disaster_type.lower() == "cyclone"]
        if cyclones:
            names = "\n".join(f"• {i.location} (Risk: {i.risk_score}/100)" for i in cyclones[:3])
            return ChatResponse(
                response=f"🌪️ **Active Cyclones ({len(cyclones)} total):**\n\n{names}\n\nTop cyclone has affected {cyclones[0].affected_population:,} people.",
                relevant_incidents=[i.incident_id for i in cyclones[:3]],
            )
        else:
            return ChatResponse(response="🌪️ There are no active cyclone incidents reported currently.")

    if any(w in msg for w in ["fire", "wildfire"]):
        fires = [i for i in incidents if i.disaster_type.lower() == "fire"]
        if fires:
            names = "\n".join(f"• {i.location} (Risk: {i.risk_score}/100)" for i in fires[:3])
            return ChatResponse(
                response=f"🔥 **Active Fires ({len(fires)} total):**\n\n{names}",
                relevant_incidents=[i.incident_id for i in fires[:3]],
            )
        else:
            return ChatResponse(response="🔥 There are no active fire incidents reported currently.")

    if any(w in msg for w in ["flood", "flooding"]):
        floods = [i for i in incidents if i.disaster_type.lower() == "flood"]
        if floods:
            names = "\n".join(f"• {i.location} (Risk: {i.risk_score}/100)" for i in floods[:3])
            return ChatResponse(
                response=f"🌊 **Active Floods ({len(floods)} total):**\n\n{names}",
                relevant_incidents=[i.incident_id for i in floods[:3]],
            )
        else:
            return ChatResponse(response="🌊 There are no active flood incidents reported currently.")

    if any(w in msg for w in ["critical", "worst", "most dangerous"]):
        if critical_incs:
            names = "\n".join(f"• {i.incident_id} — {i.location} ({i.risk_score}/100)" for i in critical_incs[:5])
            return ChatResponse(
                response=f"🔴 **Critical Incidents ({len(critical_incs)} total):**\n\n{names}",
                relevant_incidents=[i.incident_id for i in critical_incs[:5]],
            )

    # Default
    return ChatResponse(
        response=f"🤖 **DRISHTI Intelligence** — I monitor {len(incidents)} active incidents across India.\n\n**Top concern:** {top.location} — Risk {top.risk_score}/100 ({top.risk_category})\n**Total affected:** {total_affected:,} people\n\nAsk me about specific incidents, risk levels, response teams, or what-if scenarios.",
        data={"incidents": len(incidents), "critical": len(critical_incs)},
    )
