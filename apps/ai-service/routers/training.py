import time
from datetime import datetime, timedelta
from fastapi import APIRouter
import structlog
import numpy as np

from models.schemas import RetrainResponse
from services.firebase_client import get_db
from services.feature_engineering import compute_features, extract_feature_array
from ml.trainer import train_model
from ml.evaluator import evaluate_model
from config import settings

router = APIRouter()
logger = structlog.get_logger()

@router.post("/retrain-model", response_model=RetrainResponse)
async def retrain_model():
    """Fetch recent completed sessions and retrain the recommendation model."""
    from main import model_store
    db = get_db()
    
    # Fetch sessions from the last 90 days
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    
    sessions_query = db.collection("sessions")\
        .where("status", "==", "completed")\
        .where("startTime", ">=", ninety_days_ago)\
        .stream()
        
    X_list = []
    y_list = []
    
    # In a real system, we'd cache users or do bulk fetches
    # For MVP, we fetch individually (acceptable for small datasets)
    
    user_cache = {}
    def get_user(uid: str):
        if uid not in user_cache:
            doc = db.collection("users").document(uid).get()
            user_cache[uid] = doc.to_dict() if doc.exists else None
        return user_cache[uid]
        
    for session in sessions_query:
        data = session.to_dict()
        student_id = data.get("studentId")
        tutor_id = data.get("tutorId")
        
        student = get_user(student_id)
        tutor = get_user(tutor_id)
        
        if not student or not tutor:
            continue
            
        # Target: composite score
        # 40% rating, 30% completion, 30% rebooking (simplified here)
        session_rating = float(data.get("rating", 4.0)) / 5.0
        
        # We simplify target for this build: just the session rating
        target = session_rating
        
        feats = compute_features(student, tutor)
        X_list.append(extract_feature_array(feats))
        y_list.append(target)
        
    if len(X_list) < 50:
        logger.warning("insufficient_training_data", count=len(X_list))
        return RetrainResponse(
            trained=False,
            metrics=None,
            duration_seconds=0.0
        )
        
    X = np.array(X_list)
    y = np.array(y_list)
    
    # Evaluate
    metrics = evaluate_model(X, y)
    
    # Train
    pipeline, train_metrics = train_model(X, y)
    
    # In production, compare with current model's RMSE before saving.
    # We will just save the new model for this implementation.
    new_version = f"v-{int(time.time())}"
    model_store.save_model(pipeline, settings.model_path, new_version)
    
    return RetrainResponse(
        trained=True,
        metrics=metrics,
        duration_seconds=train_metrics["duration_seconds"]
    )
