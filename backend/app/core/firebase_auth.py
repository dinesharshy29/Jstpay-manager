import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth
from .firebase_admin import get_firebase_app
from ..db.connection import get_or_create_identity

bearer_scheme = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        get_firebase_app()
    except RuntimeError as error:
        logger.error("Firebase configuration error on protected route: %s", error)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is not configured on the server") from error
    except Exception as error:
        logger.exception("Firebase Admin initialization failed on protected route")
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Firebase authentication is unavailable") from error
    try:
        decoded = auth.verify_id_token(credentials.credentials)
    except auth.ExpiredIdTokenError as error:
        logger.warning("Expired Firebase ID token on protected route")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Your session has expired. Please sign in again.") from error
    except auth.InvalidIdTokenError as error:
        logger.warning("Invalid Firebase ID token on protected route")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase rejected the sign-in token. Check that frontend and backend use the same Firebase project.") from error
    except Exception as error:
        logger.warning("Firebase token verification failed: %s", type(error).__name__)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Firebase could not verify your sign-in token") from error
    identity = get_or_create_identity(decoded["uid"], decoded.get("email"), decoded.get("name"))
    firebase_claims = decoded.get("firebase", {})
    role = decoded.get("role") or ("guest" if firebase_claims.get("sign_in_provider") == "anonymous" else None)
    return {"uid": decoded["uid"], "email": decoded.get("email"), "name": decoded.get("name"), "role": role, **identity}


def require_guest(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "guest":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guest demo access is restricted to guest accounts")
    return user


def require_non_guest(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") == "guest":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Guest accounts have read-only access")
    return user


def get_non_guest_merchant(user: dict = Depends(require_non_guest)) -> dict:
    return user["merchant"]


def get_current_merchant(user: dict = Depends(get_current_user)) -> dict:
    return user["merchant"]
