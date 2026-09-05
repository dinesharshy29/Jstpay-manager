import hashlib
import hmac
import json
from decimal import Decimal
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .core.firebase_auth import get_current_merchant, get_current_user, get_non_guest_merchant, require_guest, require_non_guest
from .core.settings import CORS_ORIGINS, RAZORPAY_MODE, razorpay_is_configured
from .db.connection import get_connection
from .integrations.razorpay_client import RazorpayClient, RazorpayNotConfiguredError
from .integrations.openrouter_client import OpenRouterError, OpenRouterProvider

app = FastAPI(title="AI Risk Manager API")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.get("/api/auth/me")
def auth_me(user: dict = Depends(get_current_user)) -> dict:
    return {"uid": user["uid"], "email": user.get("email"), "name": user.get("name"), "role": user.get("role"), "user_id": user["user"]["id"], "merchant_id": user["merchant"]["id"], "authenticated": True}

@app.get("/api/demo/guest")
def guest_demo(user: dict = Depends(require_guest)) -> dict[str, str]:
    return {"role": user["role"], "access": "read-only", "data": "demo"}


class ProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=40)


class MerchantUpdate(BaseModel):
    business_name: str | None = Field(default=None, max_length=160)
    business_description: str | None = None
    industry: str | None = Field(default=None, max_length=120)
    website: str | None = Field(default=None, max_length=300)
    address: str | None = None
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    country: str | None = Field(default=None, max_length=100)
    timezone: str | None = Field(default=None, max_length=80)
    currency: str | None = Field(default=None, min_length=3, max_length=3)


class OrderCreate(BaseModel):
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    description: str | None = Field(default=None, max_length=255)
    customer_name: str | None = Field(default=None, max_length=160)
    customer_email: str | None = Field(default=None, max_length=320)
    customer_phone: str | None = Field(default=None, max_length=40)
    receipt: str | None = Field(default=None, max_length=40)
    notes: dict[str, str] = Field(default_factory=dict)


class PaymentVerification(BaseModel):
    razorpay_payment_id: str = Field(min_length=1, max_length=100)
    razorpay_order_id: str = Field(min_length=1, max_length=100)
    razorpay_signature: str = Field(min_length=1, max_length=200)


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    page: str = Field(default="/dashboard", max_length=300)
    page_title: str = Field(default="Risk Center", max_length=160)
    history: list[dict[str, str]] = Field(default_factory=list, max_length=12)


def cents(amount: Decimal) -> int:
    value = int(amount * 100)
    if amount != Decimal(value) / 100:
        raise HTTPException(status_code=422, detail="Amount must have no more than two decimal places")
    if value <= 0:
        raise HTTPException(status_code=422, detail="Amount must be greater than zero")
    return value


@app.get("/api/profile")
def profile(user: dict = Depends(get_current_user)) -> dict:
    return user["user"]


@app.put("/api/profile")
def update_profile(payload: ProfileUpdate, user: dict = Depends(require_non_guest)) -> dict:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("UPDATE users SET display_name = %s, phone = %s, updated_at = NOW() WHERE id = %s RETURNING *", (payload.display_name, payload.phone, user["user"]["id"]))
            result = cursor.fetchone()
        connection.commit()
    return result


@app.get("/api/merchant")
def merchant(current_merchant: dict = Depends(get_current_merchant)) -> dict:
    return current_merchant


@app.put("/api/merchant")
def update_merchant(payload: MerchantUpdate, current_merchant: dict = Depends(get_non_guest_merchant)) -> dict:
    fields = payload.model_dump(exclude_unset=True)
    if not fields:
        return current_merchant
    assignments = ", ".join(f"{field} = %s" for field in fields)
    values = [fields[field] for field in fields]
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"UPDATE merchants SET {assignments}, updated_at = NOW() WHERE id = %s RETURNING *", (*values, current_merchant["id"]))
            result = cursor.fetchone()
        connection.commit()
    return result


@app.get("/api/razorpay/status")
def razorpay_status(current_merchant: dict = Depends(get_current_merchant)) -> dict[str, Any]:
    return {"connected": bool(current_merchant["razorpay_connected"] and razorpay_is_configured()), "mode": RAZORPAY_MODE, "configured": razorpay_is_configured(), "webhook_configured": current_merchant["webhook_configured"], "last_sync_at": current_merchant["last_sync_at"]}


@app.get("/api/dashboard/metrics")
def dashboard_metrics(user: dict = Depends(get_current_user)) -> dict[str, Any]:
    merchant_id = user["merchant"]["id"]
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*)::int AS total_transactions,
                    COALESCE(SUM(amount) FILTER (WHERE status IN ('captured', 'succeeded')), 0)::bigint AS total_volume,
                    COUNT(*) FILTER (WHERE status IN ('captured', 'succeeded'))::int AS successful_payments,
                    COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_payments,
                    COUNT(*) FILTER (WHERE status IN ('created', 'pending', 'authorized'))::int AS pending_payments,
                    (SELECT COUNT(*) FROM refunds WHERE merchant_id = %s)::int AS refunds,
                    (SELECT COUNT(*) FROM disputes WHERE merchant_id = %s)::int AS disputes,
                    (SELECT COUNT(*) FROM disputes WHERE merchant_id = %s AND status IN ('open', 'needs_response'))::int AS chargebacks,
                    (SELECT COUNT(*) FROM risk_events WHERE merchant_id = %s)::int AS fraud_events,
                    (SELECT COUNT(*) FROM payment_links WHERE merchant_id = %s)::int AS payment_links,
                    0::bigint AS fraud_prevented,
                    0::bigint AS chargeback_saved,
                    0::int AS risk_alerts
                FROM transactions WHERE merchant_id = %s
            """, (merchant_id, merchant_id, merchant_id, merchant_id, merchant_id, merchant_id))
            result = cursor.fetchone()
    return {**result, "win_rate": None}


@app.post("/api/ai/chat")
def ai_chat(payload: AIChatRequest, user: dict = Depends(get_current_user)) -> dict[str, str]:
    merchant_id = user["merchant"]["id"]
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*)::int AS transactions, COALESCE(SUM(amount) FILTER (WHERE status IN ('captured', 'succeeded')), 0)::bigint AS volume, COUNT(*) FILTER (WHERE status IN ('captured', 'succeeded'))::int AS successful, COUNT(*) FILTER (WHERE status = 'failed')::int AS failed FROM transactions WHERE merchant_id = %s", (merchant_id,))
            metrics = cursor.fetchone()
            cursor.execute("SELECT COUNT(*)::int AS disputes FROM disputes WHERE merchant_id = %s", (merchant_id,))
            disputes_count = cursor.fetchone()["disputes"]
            cursor.execute("SELECT COUNT(*)::int AS payment_links FROM payment_links WHERE merchant_id = %s", (merchant_id,))
            links_count = cursor.fetchone()["payment_links"]

    context = {
        "user": {"email": user.get("email"), "display_name": user["user"].get("display_name")},
        "workspace": {"name": user["merchant"].get("business_name"), "currency": user["merchant"].get("currency", "INR")},
        "metrics": {**metrics, "disputes": disputes_count, "payment_links": links_count},
        "current_page": {"route": payload.page, "title": payload.page_title},
        "razorpay": {"configured": razorpay_is_configured(), "mode": RAZORPAY_MODE},
    }
    system = """You are the AI Assistant inside AI Risk Manager. Help authenticated merchants understand their payment activity, risk signals, disputes, integrations, and business operations. Use only the authorized application context below for application facts. Never invent transaction data or claim an action succeeded. Clearly distinguish live application facts from general business knowledge. Be concise and useful. You are not the final authority for financial, legal, compliance, or payment decisions."""
    messages = [{"role": "system", "content": f"{system}\nAuthorized application context: {json.dumps(context, default=str)}"}]
    messages.extend(payload.history[-12:])
    messages.append({"role": "user", "content": payload.message})
    try:
        answer = OpenRouterProvider().chat(messages=messages)
    except OpenRouterError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return {"answer": answer, "page": payload.page}


@app.get("/api/transactions")
def transactions(limit: int = Query(default=25, ge=1, le=100), offset: int = Query(default=0, ge=0), current_merchant: dict = Depends(get_current_merchant)) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT *, COUNT(*) OVER()::int AS total_count FROM transactions WHERE merchant_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s", (current_merchant["id"], limit, offset))
            rows = cursor.fetchall()
    total = rows[0]["total_count"] if rows else 0
    return {"items": [{key: value for key, value in row.items() if key != "total_count"} for row in rows], "total": total, "limit": limit, "offset": offset}


@app.get("/api/disputes")
def disputes(limit: int = Query(default=25, ge=1, le=100), offset: int = Query(default=0, ge=0), current_merchant: dict = Depends(get_current_merchant)) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT *, COUNT(*) OVER()::int AS total_count FROM disputes WHERE merchant_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s", (current_merchant["id"], limit, offset))
            rows = cursor.fetchall()
    total = rows[0]["total_count"] if rows else 0
    return {"items": [{key: value for key, value in row.items() if key != "total_count"} for row in rows], "total": total, "limit": limit, "offset": offset}


@app.post("/api/orders", status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, user: dict = Depends(require_non_guest)) -> dict[str, Any]:
    amount = cents(payload.amount)
    merchant_id = user["merchant"]["id"]
    try:
        razorpay_client = RazorpayClient()
        razorpay_order = razorpay_client.create_order(amount=amount, currency=payload.currency.upper(), receipt=payload.receipt, notes=payload.notes)
    except RazorpayNotConfiguredError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=502, detail="Razorpay rejected the order request. Check TEST MODE credentials and payment configuration.") from error
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO orders (user_id, merchant_id, razorpay_order_id, amount, currency, receipt) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *", (user["user"]["id"], merchant_id, razorpay_order["id"], amount, payload.currency.upper(), payload.receipt))
            order = cursor.fetchone()
            cursor.execute("INSERT INTO transactions (user_id, merchant_id, order_id, razorpay_order_id, amount, currency, customer_name, customer_email, customer_phone, description) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id", (user["user"]["id"], merchant_id, order["id"], razorpay_order["id"], amount, payload.currency.upper(), payload.customer_name, payload.customer_email, payload.customer_phone, payload.description))
        connection.commit()
    return {"key_id": razorpay_client.key_id, "order_id": razorpay_order["id"], "amount": amount, "currency": payload.currency.upper(), "order": order}


@app.post("/api/payments/verify")
def verify_payment(payload: PaymentVerification, user: dict = Depends(require_non_guest)) -> dict[str, Any]:
    expected = hmac.new(RAZORPAY_SECRET_BYTES(), f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment signature verification failed")
    merchant_id = user["merchant"]["id"]
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM orders WHERE razorpay_order_id = %s AND merchant_id = %s", (payload.razorpay_order_id, merchant_id))
            order = cursor.fetchone()
            if order is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
            try:
                payment = RazorpayClient().fetch_payment(payload.razorpay_payment_id)
            except Exception as error:
                raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Payment could not be confirmed") from error
            cursor.execute("""
                INSERT INTO payments (user_id, merchant_id, order_id, razorpay_payment_id, amount, currency, status, method, email, contact, captured_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CASE WHEN %s = 'captured' THEN NOW() ELSE NULL END)
                ON CONFLICT (razorpay_payment_id) DO UPDATE SET status = EXCLUDED.status, method = EXCLUDED.method, updated_at = NOW()
                RETURNING *
            """, (user["user"]["id"], merchant_id, order["id"], payload.razorpay_payment_id, payment.get("amount", order["amount"]), payment.get("currency", order["currency"]), payment.get("status", "pending"), payment.get("method"), payment.get("email"), payment.get("contact"), payment.get("status", "pending")))
            saved_payment = cursor.fetchone()
            cursor.execute("UPDATE orders SET status = %s, updated_at = NOW() WHERE id = %s", (payment.get("status", "pending"), order["id"]))
            cursor.execute("UPDATE transactions SET payment_id = %s, razorpay_payment_id = %s, status = %s, payment_method = %s, updated_at = NOW() WHERE order_id = %s AND merchant_id = %s", (saved_payment["id"], payload.razorpay_payment_id, payment.get("status", "pending"), payment.get("method"), order["id"], merchant_id))
        connection.commit()
    return {"verified": True, "payment_id": saved_payment["id"], "status": saved_payment["status"]}


def RAZORPAY_SECRET_BYTES() -> bytes:
    from .core.settings import RAZORPAY_KEY_SECRET
    return RAZORPAY_KEY_SECRET.encode()


@app.post("/api/webhooks/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str | None = Header(default=None), x_razorpay_event_id: str | None = Header(default=None)) -> dict[str, bool]:
    from .core.settings import RAZORPAY_WEBHOOK_SECRET
    body = await request.body()
    if not RAZORPAY_WEBHOOK_SECRET or not x_razorpay_signature or not x_razorpay_event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook configuration")
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
    payload_hash = hashlib.sha256(body).hexdigest()
    event = json.loads(body)
    event_type = event.get("event", "unknown")
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("INSERT INTO razorpay_webhook_events (event_id, event_type, payload_hash) VALUES (%s, %s, %s) ON CONFLICT (event_id) DO NOTHING RETURNING id", (x_razorpay_event_id, event_type, payload_hash))
            inserted = cursor.fetchone()
            if inserted is None:
                return {"received": True}
            payment_entity = event.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment_entity.get("order_id")
            if order_id:
                cursor.execute("UPDATE orders SET status = %s, updated_at = NOW() WHERE razorpay_order_id = %s", (payment_entity.get("status", event_type.removeprefix("payment.")), order_id))
                cursor.execute("""
                    UPDATE payments SET status = %s, method = COALESCE(%s, method), updated_at = NOW()
                    WHERE razorpay_payment_id = %s
                """, (payment_entity.get("status", event_type.removeprefix("payment.")), payment_entity.get("method"), payment_entity.get("id")))
                cursor.execute("UPDATE transactions SET status = %s, updated_at = NOW() WHERE razorpay_order_id = %s", (payment_entity.get("status", event_type.removeprefix("payment.")), order_id))
            cursor.execute("UPDATE razorpay_webhook_events SET processed = TRUE, processed_at = NOW() WHERE id = %s", (inserted["id"],))
        connection.commit()
    return {"received": True}
