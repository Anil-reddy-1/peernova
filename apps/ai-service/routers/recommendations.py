from datetime import datetime
from fastapi import APIRouter, HTTPException
import structlog

from models.schemas import (
    RecommendationRequest, 
    RecommendationResponse, 
    TutorRecommendation,
    CompatibilityRequest,
    CompatibilityResponse
)
from services.firebase_client import get_db
from services.feature_engineering import compute_features, extract_feature_array
from config import settings

router = APIRouter()
logger = structlog.get_logger()

# We import the global model_store from main indirectly or pass it. 
# Better: import from main in the endpoint, or create it in a separate module.
# Since it's in main.py, let's just import it lazily or refactor.
# Actually, I'll import from main inside the function to avoid circular imports.

@router.post("/recommend-tutors", response_model=RecommendationResponse)
async def recommend_tutors(req: RecommendationRequest):
    """Get ML-ranked tutor recommendations for a student."""
    from main import model_store
    db = get_db()
    
    # 1. Fetch student
    student_ref = db.collection("users").document(req.studentId).get()
    if not student_ref.exists:
        raise HTTPException(status_code=404, detail="Student not found")
    student = student_ref.to_dict()
    
    # 2. Fetch candidate tutors (filter by subject and isVerified)
    # Firebase limits how many complex filters we can do, so we might just fetch verified tutors
    # and filter in memory if the dataset is small, or use a composite index.
    # For now, fetch top rated verified tutors.
    tutors_query = db.collection("users")\
        .where("role", "==", "tutor")\
        .where("isVerified", "==", True)\
        .limit(200).stream()
        
    candidates = []
    for t in tutors_query:
        t_data = t.to_dict()
        t_data["id"] = t.id
        # Simple subject pre-filter
        if req.subject in t_data.get("subjects", []):
            candidates.append(t_data)
            
    if not candidates:
        return RecommendationResponse(
            tutors=[],
            model_version=model_store.version or "fallback",
            computed_at=datetime.utcnow().isoformat()
        )
        
    # 3. Engineer features
    ranked_tutors = []
    
    if model_store.is_loaded:
        # Batch predict
        features_list = []
        for tutor in candidates:
            feats = compute_features(student, tutor)
            features_list.append(extract_feature_array(feats))
            
        import numpy as np
        X = np.array(features_list)
        scores = model_store.predict(X)
        
        for idx, tutor in enumerate(candidates):
            ranked_tutors.append((tutor["id"], float(scores[idx])))
    else:
        # Fallback to rating
        logger.warning("model_not_loaded_using_fallback")
        for tutor in candidates:
            score = float(tutor.get("rating", 0.0))
            ranked_tutors.append((tutor["id"], score))
            
    # Sort desc
    ranked_tutors.sort(key=lambda x: x[1], reverse=True)
    
    # Take top N
    top_n = ranked_tutors[:req.limit]
    
    results = []
    for rank, (tid, score) in enumerate(top_n, 1):
        results.append(TutorRecommendation(tutorId=tid, score=score, rank=rank))
        
    return RecommendationResponse(
        tutors=results,
        model_version=model_store.version or "fallback",
        computed_at=datetime.utcnow().isoformat()
    )


@router.post("/compatibility-score", response_model=CompatibilityResponse)
async def compatibility_score(req: CompatibilityRequest):
    """Get compatibility score and feature breakdown for a student-tutor pair."""
    from main import model_store
    db = get_db()
    
    student_ref = db.collection("users").document(req.studentId).get()
    tutor_ref = db.collection("users").document(req.tutorId).get()
    
    if not student_ref.exists or not tutor_ref.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    student = student_ref.to_dict()
    tutor = tutor_ref.to_dict()
    
    feats = compute_features(student, tutor)
    
    score = 0.0
    if model_store.is_loaded:
        import numpy as np
        X = np.array([extract_feature_array(feats)])
        score = float(model_store.predict(X)[0])
    else:
        score = feats["rating_score"]
        
    # Clamp score between 0 and 1
    score = max(0.0, min(1.0, score))
    
    return CompatibilityResponse(
        score=score,
        breakdown=feats
    )
