import json
from google.cloud import firestore
from google.oauth2 import service_account
from config import settings

_db = None

def get_db() -> firestore.Client:
    global _db
    if _db is not None:
        return _db
        
    if settings.firebase_service_account_json:
        try:
            creds_dict = json.loads(settings.firebase_service_account_json)
            creds = service_account.Credentials.from_service_account_info(creds_dict)
            _db = firestore.Client(credentials=creds, project=settings.firebase_project_id)
        except json.JSONDecodeError:
            # Maybe it's a file path?
            _db = firestore.Client.from_service_account_json(settings.firebase_service_account_json)
    else:
        # Fallback to application default credentials (useful in Cloud Run)
        _db = firestore.Client(project=settings.firebase_project_id)
        
    return _db
