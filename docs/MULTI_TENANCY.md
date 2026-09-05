# Multi-tenancy

Firebase ID tokens are verified by FastAPI. The verified `uid` is the only identity input used to upsert `users`; a unique `users.firebase_uid` constraint makes provisioning idempotent. Each user has one `merchants` row, enforced by `UNIQUE (user_id)`.

Every business table stores both `user_id` and `merchant_id` with foreign keys. Protected queries use the merchant derived from the verified token. Browser-provided ownership identifiers are not accepted for authorization.

The database schema is in `backend/app/db/schema.sql`. Apply it to the configured PostgreSQL database before starting the API.
