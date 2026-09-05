# Firebase Authentication Setup

This phase supports email/password authentication only. Social login, phone auth, magic links, anonymous auth, and OAuth providers are intentionally excluded.

## Firebase Console

1. Create a Firebase project.
2. Register a Web App in Project settings.
3. Open **Authentication** and then **Sign-in providers**.
4. Enable **Email/Password** and save.
5. Add `localhost` to **Authorized domains** for local development when required.
6. Add the Vercel or Netlify production domain.
7. Add a custom domain after the production domain is available.
8. Generate Firebase Admin service-account credentials from Project settings > Service accounts. Store them in the backend deployment secret manager; never commit the JSON file.

## Environment variables

Frontend (`frontend/.env.local`, Vercel, or Netlify):

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_API_URL=
```

Backend-only deployment secrets:

```text
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
DATABASE_URL=
FRONTEND_ORIGIN=
```

The private key stays backend-only. When supplied as an environment variable, preserve its PEM value and replace escaped `\\n` sequences with real newlines at startup.

## Architecture

```text
Browser
  | email/password
  v
Firebase Authentication
  | Firebase ID token
  v
Next.js authenticated API client
  | Authorization: Bearer <token>
  v
FastAPI
  | Firebase Admin verification
  v
Authenticated backend request
  v
PostgreSQL users mapping (firebase_uid is unique)
```

## Local development

```bash
cd frontend
npm install
npm run dev

cd ../backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The frontend supports Vercel and Netlify. Add all `NEXT_PUBLIC_*` values plus `NEXT_PUBLIC_API_URL` in the provider's project environment settings. Add Firebase Admin variables only to the separate Python backend host, never to frontend hosting.
