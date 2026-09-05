# AI Risk Management Module

## 1. Purpose
The AI module evaluates transactions in real-time to assign a **Risk Score (0-100)**. It protects merchants from chargebacks while ensuring legitimate users are not falsely declined.

## 2. Architecture
- **Synchronous Path**: For high-risk heuristics, basic ML models (e.g., XGBoost) run synchronously within the Rust payment flow (response < 50ms).
- **Asynchronous Path**: Complex deep learning models (Graph Neural Networks) evaluate network relationships (e.g., shared device IDs, IPs) asynchronously to flag coordinated fraud rings.

## 3. Data Signals Evaluated
The model ingests over 150 features, including:
1. **Device Intelligence**: IP reputation, VPN/Proxy detection, device fingerprinting.
2. **Behavioral Biometrics**: Time-to-checkout, typing cadence (if SDK is used).
3. **Transaction History**: Velocity checks, cross-merchant historical success.
4. **Card Metadata**: BIN ranges, issuer country vs. billing country mismatches.

## 4. Decision Logic
Based on the risk score, the system takes automated actions:
- **0 - 40**: Low Risk. Fast-track routing to cheapest gateway.
- **41 - 75**: Medium Risk. Route to gateway with best 3D-Secure success rate; require 3DS step-up.
- **76 - 100**: High Risk. Hard block transaction. Do not send to gateway (saves processing fees).

## 5. Model Retraining
- Feedback loops are powered by webhook ingestion from processors regarding chargebacks and disputes.
- Models are retrained weekly using a shadow-deployment strategy to prevent model drift.

## 6. Assumptions & Risks
- **Assumption**: We can access sufficient historical data to train the initial baseline models.
- **Risk**: Adversarial attacks where fraudsters figure out the threshold features.
- **Mitigation**: Utilize ensemble models and frequent feature rotation.
