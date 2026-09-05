import hashlib
import hmac
import json
import uuid
import time
from decimal import Decimal
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .core.firebase_auth import get_current_merchant, get_current_user, get_non_guest_merchant, require_guest, require_non_guest
from .core.settings import CORS_ORIGINS, RAZORPAY_MODE, razorpay_is_configured
from .db.connection import ensure_schema, get_connection
from .integrations.razorpay_client import RazorpayClient, RazorpayNotConfiguredError
from .integrations.nim_client import NIMError, NVIDIAProvider
from .services.copilot_context import build_messages

app = FastAPI(title="AI Risk Manager API")
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def initialize_database() -> None:
    ensure_schema()

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
    conversation_id: str | None = None
    entity_type: str | None = Field(default=None, max_length=40)
    entity_id: str | None = Field(default=None, max_length=120)


def score_transaction(amount: int, currency: str, customer_email: str | None, customer_phone: str | None) -> tuple[int, str, list[str]]:
    factors: list[str] = []
    score = 0
    if amount >= 500000:
        score += 45
        factors.append("high_amount")
    elif amount >= 100000:
        score += 25
        factors.append("elevated_amount")
    if not customer_email:
        score += 15
        factors.append("missing_customer_email")
    if not customer_phone:
        score += 10
        factors.append("missing_customer_phone")
    if currency.upper() not in {"INR", "USD", "EUR", "GBP"}:
        score += 15
        factors.append("unusual_currency")
    score = min(score, 100)
    level = "critical" if score >= 76 else "high" if score >= 51 else "medium" if score >= 26 else "low"
    return score, level, factors


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
                    (SELECT COUNT(*) FROM risk_events WHERE merchant_id = %s AND score >= 51)::int AS risk_alerts,
                    (SELECT COUNT(*) FROM payment_links WHERE merchant_id = %s)::int AS payment_links,
                    COALESCE(SUM(amount) FILTER (WHERE risk_level IN ('high', 'critical')), 0)::bigint AS fraud_prevented,
                    COALESCE(SUM(amount) FILTER (WHERE risk_level = 'critical'), 0)::bigint AS chargeback_saved
                FROM transactions WHERE merchant_id = %s
            """, (merchant_id, merchant_id, merchant_id, merchant_id, merchant_id, merchant_id, merchant_id))
            result = cursor.fetchone()
    return {**result, "win_rate": None}


@app.get("/api/analytics")
def analytics(days: int = Query(default=30, ge=7, le=90), user: dict = Depends(get_current_user)) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT calendar.day::date AS date,
                       COUNT(t.id)::int AS transactions,
                       COALESCE(SUM(t.amount) FILTER (WHERE t.status IN ('captured', 'succeeded')), 0)::bigint AS volume,
                       COUNT(t.id) FILTER (WHERE t.status IN ('captured', 'succeeded'))::int AS successful,
                       COUNT(t.id) FILTER (WHERE t.status = 'failed')::int AS failed,
                       COUNT(t.id) FILTER (WHERE t.risk_level IN ('high', 'critical'))::int AS high_risk
                FROM generate_series(CURRENT_DATE - (%s - 1), CURRENT_DATE, interval '1 day') AS calendar(day)
                LEFT JOIN transactions t ON t.merchant_id = %s AND t.created_at::date = calendar.day::date
                GROUP BY calendar.day ORDER BY calendar.day
            """, (days, user["merchant"]["id"]))
            items = cursor.fetchall()
    return {"days": days, "items": items}


@app.get("/api/transactions/{transaction_id}")
def transaction_detail(transaction_id: int, user: dict = Depends(get_current_user)) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM transactions WHERE id = %s AND merchant_id = %s", (transaction_id, user["merchant"]["id"]))
            transaction = cursor.fetchone()
            if transaction is None:
                raise HTTPException(status_code=404, detail="Transaction not found")
            cursor.execute("SELECT event_type, score, created_at FROM risk_events WHERE transaction_id = %s AND merchant_id = %s ORDER BY created_at DESC", (transaction_id, user["merchant"]["id"]))
            risk_events = cursor.fetchall()
    return {"transaction": transaction, "risk_events": risk_events}


@app.get("/api/risk/events")
def risk_events(limit: int = Query(default=25, ge=1, le=100), user: dict = Depends(get_current_user)) -> dict[str, Any]:
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT re.*, t.amount, t.currency, t.customer_name, t.status, t.risk_level FROM risk_events re LEFT JOIN transactions t ON t.id = re.transaction_id WHERE re.merchant_id = %s ORDER BY re.created_at DESC LIMIT %s", (user["merchant"]["id"], limit))
            items = cursor.fetchall()
    return {"items": items, "total": len(items)}


@app.get("/api/ai/health")
def ai_health(user: dict = Depends(get_current_user)) -> dict[str, object]:
    return NVIDIAProvider().health()


@app.post("/api/ai/chat")
def ai_chat(payload: AIChatRequest, user: dict = Depends(get_current_user)) -> StreamingResponse:
    provider = NVIDIAProvider()
    try:
        messages, sources = build_messages(user, payload.message, payload.page, payload.history, payload.entity_type, payload.entity_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Workspace context could not be retrieved.") from exc
    merchant_id = user["merchant"]["id"]
    user_id = user["user"]["id"]
    conversation_id = payload.conversation_id
    if conversation_id:
        try:
            uuid.UUID(conversation_id)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="conversation_id must be a valid UUID") from exc
    started = time.monotonic()

    def events():
        nonlocal conversation_id
        assistant_content = ""
        try:
            with get_connection() as connection:
                with connection.cursor() as cursor:
                    if conversation_id:
                        cursor.execute("SELECT id FROM ai_conversations WHERE id = %s AND user_id = %s AND merchant_id = %s", (conversation_id, user_id, merchant_id))
                        if cursor.fetchone() is None:
                            conversation_id = None
                    if not conversation_id:
                        cursor.execute("INSERT INTO ai_conversations (user_id, merchant_id, title) VALUES (%s, %s, %s) RETURNING id", (user_id, merchant_id, payload.message[:80]))
                        conversation_id = str(cursor.fetchone()["id"])
                    cursor.execute("INSERT INTO ai_messages (conversation_id, user_id, merchant_id, role, content) VALUES (%s, %s, %s, 'user', %s)", (conversation_id, user_id, merchant_id, payload.message))
                connection.commit()
            yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id, 'sources': sources})}\n\n"
            for chunk in provider.stream(messages):
                assistant_content += chunk
                yield f"data: {json.dumps({'type': 'delta', 'content': chunk})}\n\n"
            with get_connection() as connection:
                with connection.cursor() as cursor:
                    cursor.execute("INSERT INTO ai_messages (conversation_id, user_id, merchant_id, role, content, sources) VALUES (%s, %s, %s, 'assistant', %s, %s)", (conversation_id, user_id, merchant_id, assistant_content, json.dumps(sources)))
                    cursor.execute("INSERT INTO audit_logs (user_id, merchant_id, action, resource_type, resource_id, result, metadata) VALUES (%s, %s, 'ai_copilot_request', 'conversation', %s, 'success', %s)", (user_id, merchant_id, conversation_id, json.dumps({'model': provider.model, 'latency_ms': round((time.monotonic() - started) * 1000)})))
                connection.commit()
            yield "data: {\"type\": \"done\"}\n\n"
        except NIMError as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


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
    risk_score, risk_level, risk_factors = score_transaction(amount, payload.currency, payload.customer_email, payload.customer_phone)
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
            cursor.execute("INSERT INTO transactions (user_id, merchant_id, order_id, razorpay_order_id, amount, currency, customer_name, customer_email, customer_phone, description, fraud_score, risk_level, risk_factors) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id", (user["user"]["id"], merchant_id, order["id"], razorpay_order["id"], amount, payload.currency.upper(), payload.customer_name, payload.customer_email, payload.customer_phone, payload.description, risk_score, risk_level, json.dumps(risk_factors)))
            transaction = cursor.fetchone()
            if risk_score >= 51:
                cursor.execute("INSERT INTO risk_events (user_id, merchant_id, transaction_id, event_type, score) VALUES (%s, %s, %s, %s, %s)", (user["user"]["id"], merchant_id, transaction["id"], "transaction_flagged", risk_score))
            cursor.execute("INSERT INTO audit_logs (user_id, merchant_id, action, resource_type, resource_id, result, metadata) VALUES (%s, %s, %s, %s, %s, %s, %s)", (user["user"]["id"], merchant_id, "transaction_created", "transaction", str(transaction["id"]), "success", json.dumps({"risk_score": risk_score, "risk_level": risk_level})))
        connection.commit()
    return {"key_id": razorpay_client.key_id, "order_id": razorpay_order["id"], "amount": amount, "currency": payload.currency.upper(), "order": order, "risk_score": risk_score, "risk_level": risk_level, "risk_factors": risk_factors}


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
