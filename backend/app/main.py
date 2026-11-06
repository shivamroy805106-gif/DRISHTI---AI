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

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
cors_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")
if cors_env.strip() == "*":
    allow_origins = ["*"]
    allow_credentials = False
else:
    allow_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
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


@app.get("/health")
def health():
    return {"status": "healthy", "service": "DRISHTI-AI Backend"}


@app.get("/api")
def api_info():
    return {
        "name": "DRISHTI-AI",
        "version": "1.0.0",
        "tagline": "See the Risk. Predict the Threat. Save Lives.",
        "docs": "/api/docs",
        "status": "operational",
    }


frontend_dir = os.path.join(ROOT_DIR, "frontend", "dist")
if os.path.isdir(frontend_dir):
    assets_dir = os.path.join(frontend_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dir, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if (
            full_path.startswith("api")
            or full_path.startswith("docs")
            or full_path.startswith("redoc")
            or full_path.startswith("openapi.json")
        ):
            raise HTTPException(status_code=404, detail="Not found")

        file_path = os.path.join(frontend_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dir, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": "DRISHTI-AI API",
            "version": "1.0.0",
            "tagline": "See the Risk. Predict the Threat. Save Lives.",
            "docs": "/api/docs",
            "status": "operational",
        }
