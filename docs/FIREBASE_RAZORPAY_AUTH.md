# Firebase and Razorpay authentication

The frontend obtains a Firebase ID token through the existing `AuthProvider` and sends it as `Authorization: Bearer <token>` through the central API client. FastAPI verifies the token with Firebase Admin and derives `firebase_uid`, email, application user, and merchant workspace server-side.

Razorpay credentials are backend-only. `RAZORPAY_KEY_ID` may be returned as safe checkout configuration; `RAZORPAY_KEY_SECRET`, webhook secrets, database credentials, and Firebase Admin private keys must never be sent to the frontend.
