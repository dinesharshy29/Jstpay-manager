import os

from dotenv import load_dotenv

load_dotenv()


RAZORPAY_MODE = os.getenv("RAZORPAY_MODE", "test").lower()
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")).split(",") if origin.strip()]
NVIDIA_NIM_API_KEY = os.getenv("NVIDIA_NIM_API_KEY", "")
NVIDIA_NIM_BASE_URL = os.getenv("NVIDIA_NIM_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_NIM_MODEL = os.getenv("NVIDIA_NIM_MODEL", "")


def razorpay_is_configured() -> bool:
    return bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)