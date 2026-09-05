# Razorpay TEST setup

Set these variables in `backend/.env` or the deployment secret manager:

```env
RAZORPAY_MODE=test
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Never use `NEXT_PUBLIC_` for a Razorpay secret. The browser receives only the public key from a future checkout endpoint. Create webhook configuration in the Razorpay dashboard using the HTTPS backend URL and store the webhook secret only on the backend.

Install and run:

```bash
cd backend
.venv/bin/pip install -r requirements.txt
psql "$DATABASE_URL" -f app/db/schema.sql
.venv/bin/uvicorn app.main:app --reload --port 8000
```

The current implementation includes the server-side Razorpay client and TEST order creation endpoint. Checkout signature verification, refunds, payment links, webhook processing, and synchronization are still pending implementation.
