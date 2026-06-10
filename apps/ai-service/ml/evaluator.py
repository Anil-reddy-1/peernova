import numpy as np
from sklearn.model_selection import KFold
from sklearn.metrics import mean_squared_error, ndcg_score
from ml.trainer import create_pipeline

def evaluate_model(X: np.ndarray, y: np.ndarray) -> dict:
    """Evaluate the model using 5-fold cross-validation."""
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    
    rmse_scores = []
    ndcg_scores = []
    
    for train_index, test_index in kf.split(X):
        X_train, X_test = X[train_index], X[test_index]
        y_train, y_test = y[train_index], y[test_index]
        
        pipeline = create_pipeline()
        pipeline.fit(X_train, y_train)
        
        preds = pipeline.predict(X_test)
        
        # RMSE
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        rmse_scores.append(rmse)
        
        # NDCG@10 (Requires 2D arrays, we treat it as 1 query with N results)
        if len(y_test) > 1:
            try:
                ndcg = ndcg_score([y_test], [preds], k=10)
                ndcg_scores.append(ndcg)
            except ValueError:
                pass

    return {
        "mean_rmse": float(np.mean(rmse_scores)),
        "mean_ndcg_10": float(np.mean(ndcg_scores)) if ndcg_scores else 0.0
    }
