# Database Design

## 1. Overview
The PostgreSQL database is designed for high concurrency and relational integrity, managing merchant accounts, payment intents, and routing configurations.

## 2. Entity Relationship (ER) Diagram

```mermaid
erDiagram
    MERCHANT_ACCOUNT ||--o{ PAYMENT_INTENT : creates
    MERCHANT_ACCOUNT ||--o{ ROUTING_RULES : configures
    PAYMENT_INTENT ||--o{ PAYMENT_ATTEMPT : has
    PAYMENT_INTENT ||--o{ REFUND : has
    PAYMENT_ATTEMPT ||--|| AI_RISK_SCORE : generates
    
    MERCHANT_ACCOUNT {
        string merchant_id PK
        string api_key
        string name
        boolean is_active
    }
    PAYMENT_INTENT {
        string intent_id PK
        string merchant_id FK
        integer amount
        string currency
        string status
    }
    PAYMENT_ATTEMPT {
        string attempt_id PK
        string intent_id FK
        string connector
        string status
        string error_message
    }
    AI_RISK_SCORE {
        string attempt_id FK
        integer risk_score
        string risk_level
        jsonb signals
    }
```

## 3. Key Tables & Constraints
- **merchant_account**: Primary key `merchant_id`. Stores configuration and API credentials (hashed).
- **payment_intent**: Represents the lifecycle of a user's checkout session. Statuses: `requires_payment_method`, `processing`, `succeeded`, `failed`.
- **payment_attempt**: A single try against a specific payment processor. Includes the `connector` used and the `status`.

## 4. Indexing Strategy
- Heavy read queries (e.g., dashboard analytics) are supported by composite indexes on `merchant_id` + `created_at`.
- Lookups by external processor IDs are indexed to speed up webhook processing.

## 5. Data Privacy
- PII (Personally Identifiable Information) and PCI data are strictly segregated. Sensitive fields are encrypted at rest using AES-256-GCM.
