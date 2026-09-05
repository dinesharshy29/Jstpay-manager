import json
from typing import Any

from ..db.connection import get_connection


SYSTEM_PROMPT = """You are the AI Risk Copilot for a payment intelligence platform.
Only use the authorized workspace context supplied in this request. Never invent payment activity, IDs, amounts, customers, disputes, evidence, dates, risk scores, or outcomes. If information is unavailable, say: I couldn't find that information in the authorized workspace data. Clearly distinguish verified workspace facts from general guidance. Never expose secrets or another workspace's data. Recommend sensitive actions but never claim to have executed them. Be concise, practical, and cite the supplied source labels when relevant."""


def build_context(user: dict[str, Any], page: str, entity_type: str | None = None, entity_id: str | None = None) -> tuple[str, list[dict[str, str]]]:
    merchant_id = user["merchant"]["id"]
    sources: list[dict[str, str]] = []
    with get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*)::int AS transactions, COALESCE(SUM(amount) FILTER (WHERE status IN ('captured','succeeded')),0)::bigint AS volume, COUNT(*) FILTER (WHERE status IN ('captured','succeeded'))::int AS successful, COUNT(*) FILTER (WHERE risk_level IN ('high','critical'))::int AS high_risk FROM transactions WHERE merchant_id = %s", (merchant_id,))
            metrics = cursor.fetchone()
            cursor.execute("SELECT id, transaction_id, event_type, score, created_at FROM risk_events WHERE merchant_id = %s ORDER BY created_at DESC LIMIT 5", (merchant_id,))
            events = cursor.fetchall()
            if events:
                sources.append({"type": "risk_events", "id": "latest"})
            entity: dict[str, Any] | None = None
            if entity_type == "transaction" and entity_id and entity_id.isdigit():
                cursor.execute("SELECT id, amount, currency, status, customer_name, fraud_score, risk_level, risk_factors, created_at FROM transactions WHERE id = %s AND merchant_id = %s", (int(entity_id), merchant_id))
                entity = cursor.fetchone()
                if entity:
                    sources.append({"type": "transaction", "id": str(entity["id"])})
    context = {
        "workspace": {"merchant_id": merchant_id, "role": user.get("role") or "user"},
        "current_page": page,
        "metrics": metrics,
        "recent_risk_events": events,
        "selected_entity": entity,
    }
    return json.dumps(context, default=str), sources


def build_messages(user: dict[str, Any], message: str, page: str, history: list[dict[str, str]], entity_type: str | None, entity_id: str | None) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    context, sources = build_context(user, page, entity_type, entity_id)
    messages = [{"role": "system", "content": f"{SYSTEM_PROMPT}\nAuthorized workspace context:\n{context}"}]
    messages.extend(history[-10:])
    messages.append({"role": "user", "content": message[:4000]})
    return messages, sources
