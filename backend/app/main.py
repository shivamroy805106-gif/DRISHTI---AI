"""
DRISHTI-AI — FastAPI Main Application
Disaster Risk Intelligence & Safety Tracking Hub
"""
import os
import sys
import logging

# Ensure project root is in path for ML imports
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

from backend.app.database.db import create_tables, SessionLocal, seed_database
from backend.app.routes.incidents import router as incidents_router
from backend.app.routes.analysis import router as analysis_router
from backend.app.routes.citizen_reports import router as reports_router
from backend.app.routes.misc import (
    alerts_router, teams_router, analytics_router, chat_router
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drishti-ai")

app = FastAPI(
    title="DRISHTI-AI API",
    description="Disaster Risk Intelligence & Safety Tracking Hub — AI/ML Powered Emergency Response Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include routers
app.include_router(incidents_router)
app.include_router(analysis_router)
app.include_router(reports_router)
app.include_router(alerts_router)
app.include_router(teams_router)
app.include_router(analytics_router)
app.include_router(chat_router)


@app.on_event("startup")
async def startup():
    logger.info("🚀 DRISHTI-AI starting up...")
    create_tables()
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

    # Pre-load ML models
    try:
        from ml.predict import get_models
        get_models()
        logger.info("✅ ML models loaded successfully")
    except Exception as e:
        logger.warning(f"⚠️ ML model loading deferred: {e}")

    logger.info("✅ DRISHTI-AI is ready!")


@app.get("/")
def root():
    return {
        "name": "DRISHTI-AI",
        "version": "1.0.0",
        "tagline": "See the Risk. Predict the Threat. Save Lives.",
        "docs": "/api/docs",
        "status": "operational",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "DRISHTI-AI Backend"}
