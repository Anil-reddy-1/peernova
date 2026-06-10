import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import KFold
import structlog
import time

logger = structlog.get_logger()

def create_pipeline() -> Pipeline:
    """Create the ML pipeline for tutor recommendation scoring."""
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('regressor', GradientBoostingRegressor(
            n_estimators=200,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42
        ))
    ])
    return pipeline

def train_model(X: np.ndarray, y: np.ndarray) -> tuple[Pipeline, dict]:
    """Train the model and return the pipeline and metrics."""
    logger.info("training_started", samples=len(X), features=X.shape[1])
    start_time = time.time()
    
    pipeline = create_pipeline()
    pipeline.fit(X, y)
    
    duration = time.time() - start_time
    logger.info("training_completed", duration=duration)
    
    # Feature importances
    importances = pipeline.named_steps['regressor'].feature_importances_
    
    return pipeline, {
        "duration_seconds": duration,
        "feature_importances": importances.tolist()
    }
