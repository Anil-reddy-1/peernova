from pydantic import BaseModel, Field
from typing import List, Dict, Any

class RecommendationRequest(BaseModel):
    studentId: str
    subject: str
    limit: int = Field(default=10, le=50)

class TutorRecommendation(BaseModel):
    tutorId: str
    score: float
    rank: int

class RecommendationResponse(BaseModel):
    tutors: List[TutorRecommendation]
    model_version: str
    computed_at: str

class CompatibilityRequest(BaseModel):
    studentId: str
    tutorId: str

class CompatibilityResponse(BaseModel):
    score: float
    breakdown: Dict[str, float]

class RetrainResponse(BaseModel):
    trained: bool
    metrics: Dict[str, float] | None
    duration_seconds: float
