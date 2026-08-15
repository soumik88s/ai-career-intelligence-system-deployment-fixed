"""
AI Career Intelligence System - FastAPI Microservice
Phase 2: PostgreSQL Database & Secure Authentication Foundation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from backend.app.api.auth import router as auth_router
from backend.app.api.users import router as users_router
from backend.app.api.resumes import router as resumes_router

app = FastAPI(
    title="AI Career Intelligence System - ML & RAG Microservice",
    description="Explainable AI-Based Career Recommendation and Job Matching Using NLP, Deep Learning, and RAG",
    version="2.0.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "system": "AI Career Intelligence System ML Microservice",
        "status": "online",
        "phase": "Phase 2 - Database & Secure Authentication",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "phase": "Phase 2 - Active",
        "database_url_configured": bool(os.getenv("DATABASE_URL")),
        "gemini_api_key_configured": bool(os.getenv("GEMINI_API_KEY"))
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
