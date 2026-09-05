import os

from dotenv import load_dotenv

load_dotenv()


RAZORPAY_MODE = os.getenv("RAZORPAY_MODE", "test").lower()
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")).split(",") if origin.strip()]


def razorpay_is_configured() -> bool:
    return bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)