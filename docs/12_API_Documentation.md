# API Documentation

## Overview
The API is organized around REST. It accepts JSON-encoded request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

## Authentication
Authenticate your API requests by providing your API key in the `Authorization` header.
- **Header**: `Authorization: Bearer <YOUR_API_KEY>`

---

## 1. Create a Payment Intent
Initiate a new payment process.

- **Method**: `POST`
- **Route**: `/v1/payments`
- **Headers**: 
  - `Content-Type: application/json`
  - `Authorization: Bearer <API_KEY>`

### Request Body
```json
{
  "amount": 1000,
  "currency": "USD",
  "customer_id": "cus_12345",
  "description": "Premium Subscription"
}
```

### Response (200 OK)
```json
{
  "intent_id": "pi_987654321",
  "status": "requires_payment_method",
  "amount": 1000,
  "currency": "USD",
  "client_secret": "pi_987654321_secret_abc123"
}
```

---

## 2. Confirm a Payment
Confirm the intent with a payment method.

- **Method**: `POST`
- **Route**: `/v1/payments/{intent_id}/confirm`

### Request Body
```json
{
  "payment_method_data": {
    "type": "card",
    "card": {
      "number": "424242424242424242",
      "exp_month": 12,
      "exp_year": 2030,
      "cvc": "123"
    }
  }
}
```

### Response (200 OK)
```json
{
  "intent_id": "pi_987654321",
  "status": "succeeded",
  "risk_score": 12,
  "routed_through": "stripe"
}
```

## Error Codes
- `400 Bad Request`: Invalid parameters.
- `401 Unauthorized`: Invalid API Key.
- `402 Payment Required`: The payment attempt failed (e.g., insufficient funds).
- `403 Forbidden`: Transaction blocked by AI Risk Manager due to high fraud probability.
