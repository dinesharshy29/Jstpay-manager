# Razorpay webhooks

Webhook handling must verify the Razorpay signature before processing. Store the provider event ID in `razorpay_webhook_events` with a unique constraint, hash the payload, and return an idempotent success for duplicate event IDs.

The schema includes the event table, but the FastAPI webhook route and event processors are not yet implemented. Do not mark local payment state as final from an unverified browser callback.
