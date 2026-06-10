import os
import joblib
import structlog
from typing import Any

logger = structlog.get_logger()

class ModelStore:
    def __init__(self):
        self.pipeline = None
        self.version = None

    @property
    def is_loaded(self) -> bool:
        return self.pipeline is not None

    def load_model(self, path: str):
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found at {path}")
            
        data = joblib.load(path)
        self.pipeline = data.get("pipeline")
        self.version = data.get("version", "unknown")
        
    def save_model(self, pipeline: Any, path: str, version: str):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        data = {
            "pipeline": pipeline,
            "version": version
        }
        joblib.dump(data, path)
        self.pipeline = pipeline
        self.version = version
        logger.info("model_saved", path=path, version=version)

    def predict(self, features):
        if not self.is_loaded:
            raise RuntimeError("Model is not loaded")
        return self.pipeline.predict(features)
