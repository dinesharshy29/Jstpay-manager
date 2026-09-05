CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    firebase_uid TEXT NOT NULL UNIQUE,
    email TEXT,
    display_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchants (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT,
    business_description TEXT,
    industry TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency TEXT NOT NULL DEFAULT 'INR',
    razorpay_connected BOOLEAN NOT NULL DEFAULT FALSE,
    razorpay_mode TEXT NOT NULL DEFAULT 'test' CHECK (razorpay_mode IN ('test', 'live')),
    connected_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ,
    webhook_configured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    receipt TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_payment_id TEXT NOT NULL UNIQUE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    method TEXT,
    email TEXT,
    contact TEXT,
    captured_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    payment_method TEXT,
    fraud_score NUMERIC,
    chargeback_risk NUMERIC,
    risk_level TEXT,
    description TEXT,
    internal_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_links (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    razorpay_payment_link_id TEXT NOT NULL UNIQUE,
    short_url TEXT,
    amount BIGINT NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'created',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refunds (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_id BIGINT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    razorpay_refund_id TEXT UNIQUE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'created',
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS disputes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'open',
    amount BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_events (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    transaction_id BIGINT REFERENCES transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    score NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    result TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    payload_hash TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_merchants_user_id ON merchants(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_owner ON orders(user_id, merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON payments(user_id, merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON transactions(user_id, merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_owner ON disputes(user_id, merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_risk_events_owner ON risk_events(user_id, merchant_id, created_at DESC);
