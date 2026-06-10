import math
from typing import Dict, Any, List

MAX_REVIEWS = 1000
MAX_SESSIONS = 5000

def compute_features(student: Dict[str, Any], tutor: Dict[str, Any]) -> Dict[str, float]:
    """
    Extract features for compatibility scoring.
    """
    # 1. subject_overlap: Jaccard similarity
    student_subjects = set(student.get("subjects", []))
    tutor_subjects = set(tutor.get("subjects", []))
    if not student_subjects and not tutor_subjects:
        subject_overlap = 0.0
    else:
        intersection = len(student_subjects.intersection(tutor_subjects))
        union = len(student_subjects.union(tutor_subjects))
        subject_overlap = float(intersection) / union if union > 0 else 0.0

    # 2. level_match: boolean
    student_level = student.get("level", "")
    tutor_levels = tutor.get("levels", [])
    level_match = 1.0 if student_level in tutor_levels else 0.0

    # 3. rating_score
    rating = tutor.get("rating", 0.0)
    rating_score = float(rating) / 5.0

    # 4. price_match
    student_budget = float(student.get("budget", 50))
    tutor_rate = float(tutor.get("hourlyRate", 50))
    max_price = max(student_budget, tutor_rate)
    if max_price == 0:
        price_match = 1.0
    else:
        price_match = 1.0 - (abs(student_budget - tutor_rate) / max_price)

    # 5. language_overlap
    student_lang = student.get("preferredLanguage", "English")
    tutor_langs = tutor.get("languages", ["English"])
    language_overlap = 1.0 if student_lang in tutor_langs else 0.0

    # 6. schedule_overlap
    # Simplified: fraction of student's preferred hours overlapping tutor's
    student_hours = set(student.get("preferredHours", []))
    tutor_hours = set(tutor.get("availableHours", []))
    if not student_hours:
        schedule_overlap = 0.5 # Neutral if student has no preference
    else:
        overlap = len(student_hours.intersection(tutor_hours))
        schedule_overlap = float(overlap) / len(student_hours)

    # 7. review_volume
    review_count = tutor.get("reviewCount", 0)
    review_volume = math.log1p(review_count) / math.log1p(MAX_REVIEWS)

    # 8. session_experience
    total_sessions = tutor.get("totalSessions", 0)
    session_experience = math.log1p(total_sessions) / math.log1p(MAX_SESSIONS)

    # 9. response_rate
    response_rate = float(tutor.get("responseRate", 0.8))

    return {
        "subject_overlap": subject_overlap,
        "level_match": level_match,
        "rating_score": rating_score,
        "price_match": price_match,
        "language_overlap": language_overlap,
        "schedule_overlap": schedule_overlap,
        "review_volume": min(review_volume, 1.0),
        "session_experience": min(session_experience, 1.0),
        "response_rate": response_rate,
    }

def extract_feature_array(features: Dict[str, float]) -> List[float]:
    """Convert feature dict to an ordered array for the ML model."""
    keys = [
        "subject_overlap",
        "level_match",
        "rating_score",
        "price_match",
        "language_overlap",
        "schedule_overlap",
        "review_volume",
        "session_experience",
        "response_rate"
    ]
    return [features[k] for k in keys]
