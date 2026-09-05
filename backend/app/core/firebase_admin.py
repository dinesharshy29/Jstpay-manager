import firebase_admin
import logging
from firebase_admin import credentials
from dotenv import load_dotenv
from os import environ

load_dotenv()
logger = logging.getLogger(__name__)


def get_firebase_app() -> firebase_admin.App:
    if firebase_admin._apps:
        return firebase_admin.get_app()

    project_id = environ.get("FIREBASE_PROJECT_ID", "")
    private_key = environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")
    required = {"project_id": project_id, "client_email": environ.get("FIREBASE_CLIENT_EMAIL"), "private_key": private_key}
    missing = [name for name, value in required.items() if not value]
    if missing:
        raise RuntimeError(f"Missing Firebase server configuration: {', '.join(missing)}")

    logger.info("Firebase project configured: %s", project_id)
    return firebase_admin.initialize_app(credentials.Certificate(required))
