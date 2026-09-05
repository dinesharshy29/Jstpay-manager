from typing import Any

import razorpay

from ..core.settings import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, razorpay_is_configured


class RazorpayNotConfiguredError(RuntimeError):
    """Raised when the backend has not been given Razorpay credentials."""


class RazorpayClient:
    def __init__(self) -> None:
        if not razorpay_is_configured():
            raise RazorpayNotConfiguredError("Razorpay is not connected.")
        self.key_id = RAZORPAY_KEY_ID
        self._client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

    def create_order(self, *, amount: int, currency: str = "INR", receipt: str | None = None, notes: dict[str, str] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {"amount": amount, "currency": currency, "payment_capture": 1}
        if receipt:
            payload["receipt"] = receipt
        if notes:
            payload["notes"] = notes
        return self._client.order.create(payload)

    def fetch_order(self, order_id: str) -> dict[str, Any]:
        return self._client.order.fetch(order_id)

    def fetch_orders(self, *, count: int = 10, skip: int = 0) -> list[dict[str, Any]]:
        return self._client.order.all({"count": count, "skip": skip}).get("items", [])

    def fetch_payment(self, payment_id: str) -> dict[str, Any]:
        return self._client.payment.fetch(payment_id)

    def fetch_payments(self, order_id: str, *, count: int = 10, skip: int = 0) -> list[dict[str, Any]]:
        return self._client.order.payments(order_id, {"count": count, "skip": skip}).get("items", [])

    def capture_payment(self, payment_id: str, *, amount: int, currency: str = "INR") -> dict[str, Any]:
        return self._client.payment.capture(payment_id, amount, {"currency": currency})

    def create_payment_link(self, payload: dict[str, Any]) -> dict[str, Any]:
        return self._client.payment_link.create(payload)

    def fetch_payment_link(self, link_id: str) -> dict[str, Any]:
        return self._client.payment_link.fetch(link_id)

    def update_payment_link(self, link_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self._client.payment_link.edit(link_id, payload)

    def cancel_payment_link(self, link_id: str) -> dict[str, Any]:
        return self._client.payment_link.cancel(link_id)

    def refund_payment(self, payment_id: str, *, amount: int | None = None, notes: dict[str, str] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {}
        if amount is not None:
            payload["amount"] = amount
        if notes:
            payload["notes"] = notes
        return self._client.payment.refund(payment_id, payload)