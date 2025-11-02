#!/usr/bin/env python3
"""
Hybrid Job Recommendation Service
A FastAPI service that provides advanced machine learning-based job recommendations
"""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Dict, Any, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation_engine import HybridJobRecommendationEngine
from database import DatabaseManager
from config import Config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global instances
db_manager = None
recommendation_engine = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    global db_manager, recommendation_engine
    
    try:
        # Initialize database connection
        logger.info("🔌 Initializing database connection...")
        db_manager = DatabaseManager()
        await db_manager.initialize()
        
        # Initialize recommendation engine
        logger.info("🤖 Initializing recommendation engine...")
        recommendation_engine = HybridJobRecommendationEngine(db_manager)
        await recommendation_engine.initialize()
        
        logger.info("✅ Hybrid Job Recommendation Service is ready!")
        logger.info("📡 Listening on 0.0.0.0:5001")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Failed to start service: {e}")
        raise
    finally:
        # Cleanup
        if db_manager:
            await db_manager.close()
        logger.info("🔄 Service shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="Hybrid Job Recommendation Service",
    description="Advanced ML-based job recommendation system for ACC Job Portal",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class RecommendationRequest(BaseModel):
    user_id: int
    limit: Optional[int] = 10
    include_reasons: Optional[bool] = True

class JobRecommendation(BaseModel):
    job_id: int
    content_score: float
    knowledge_score: float  
    hybrid_score: float
    confidence: float
    reasons: List[str]
    job_title: str
    job_category: str
    company_name: Optional[str]

class RecommendationResponse(BaseModel):
    success: bool
    message: str
    user_id: int
    total_jobs_analyzed: int
    recommendations: List[JobRecommendation]
    algorithm_info: Dict[str, Any]
    processing_time_ms: float

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    database_connected: bool
    ml_models_loaded: bool

# Dependency injection
async def get_recommendation_engine() -> HybridJobRecommendationEngine:
    if recommendation_engine is None:
        raise HTTPException(status_code=500, detail="Recommendation engine not initialized")
    return recommendation_engine

async def get_db_manager() -> DatabaseManager:
    if db_manager is None:
        raise HTTPException(status_code=500, detail="Database manager not initialized")
    return db_manager

# API Endpoints
@app.get("/", response_model=HealthResponse)
async def health_check(
    db: DatabaseManager = Depends(get_db_manager),
    engine: HybridJobRecommendationEngine = Depends(get_recommendation_engine)
):
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="Hybrid Job Recommendation Service",
        version="2.0.0",
        timestamp=datetime.now().isoformat(),
        database_connected=await db.is_connected(),
        ml_models_loaded=engine.is_ready()
    )

@app.post("/recommendations", response_model=RecommendationResponse)
async def get_recommendations(
    request: RecommendationRequest,
    engine: HybridJobRecommendationEngine = Depends(get_recommendation_engine)
):
    """
    Get hybrid job recommendations for a user
    
    Combines content-based filtering and knowledge matching for optimal results.
    Only uses completed resumes and comprehensive user profile data.
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"🎯 Getting recommendations for user {request.user_id}")
        
        # Get recommendations from hybrid engine
        recommendations = await engine.get_recommendations(
            user_id=request.user_id,
            limit=request.limit,
            include_reasons=request.include_reasons
        )
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        logger.info(f"✅ Generated {len(recommendations)} recommendations in {processing_time:.2f}ms")
        
        return RecommendationResponse(
            success=True,
            message=f"Generated {len(recommendations)} personalized job recommendations",
            user_id=request.user_id,
            total_jobs_analyzed=await engine.get_total_active_jobs(),
            recommendations=recommendations,
            algorithm_info=engine.get_algorithm_info(),
            processing_time_ms=round(processing_time, 2)
        )
        
    except ValueError as e:
        logger.warning(f"⚠️ User data issue for user {request.user_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"❌ Error generating recommendations for user {request.user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/user/{user_id}/profile")
async def get_user_profile_debug(
    user_id: int,
    engine: HybridJobRecommendationEngine = Depends(get_recommendation_engine)
):
    """Debug endpoint to inspect user profile data"""
    try:
        profile_data = await engine.get_user_profile_debug(user_id)
        return {
            "success": True,
            "user_id": user_id,
            "profile": profile_data
        }
    except Exception as e:
        logger.error(f"❌ Error getting profile for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/jobs/active/count")
async def get_active_jobs_count(
    engine: HybridJobRecommendationEngine = Depends(get_recommendation_engine)
):
    """Get count of active jobs available for recommendations"""
    try:
        count = await engine.get_total_active_jobs()
        return {
            "success": True,
            "active_jobs_count": count
        }
    except Exception as e:
        logger.error(f"❌ Error getting active jobs count: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
async def retrain_models(
    engine: HybridJobRecommendationEngine = Depends(get_recommendation_engine)
):
    """Retrain ML models with latest data"""
    try:
        logger.info("🔄 Starting model retraining...")
        await engine.retrain_models()
        logger.info("✅ Model retraining completed")
        return {
            "success": True,
            "message": "Models retrained successfully"
        }
    except Exception as e:
        logger.error(f"❌ Error retraining models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return {
        "success": False,
        "error": exc.detail,
        "status_code": exc.status_code
    }

if __name__ == "__main__":
    # Configuration
    host = Config.HOST
    port = Config.PORT
    
    logger.info(f"🚀 Starting Hybrid Job Recommendation Service on {host}:{port}")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=Config.DEBUG,
        log_level="info" if not Config.DEBUG else "debug"
    )
