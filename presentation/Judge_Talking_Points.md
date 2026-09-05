# Judge QA & Talking Points

## 1. "Isn't this just a Stripe wrapper?"
**Answer:** "No. We actually abstract Stripe alongside 100+ other gateways. If Stripe declines a card due to generic risk rules, our engine can instantly, automatically retry that same card on Adyen or Braintree without the user even noticing, saving the sale. Plus, our AI fraud model sits *above* the gateways, protecting you globally."

## 2. "Why build this in Rust instead of Node/Python?"
**Answer:** "Payments require extreme reliability and low latency. Rust gives us memory safety (no segfaults), fearless concurrency, and bare-metal performance. Our core router handles routing logic in under 50ms, which is critical when a user is waiting at checkout."

## 3. "How do you handle PCI Compliance?"
**Answer:** "We've architected a strictly isolated 'Card Vault' microservice. The main application router never sees raw card numbers; it only handles tokens. This allows merchants to achieve PCI-DSS compliance easily while maintaining full control over their tokenized data."

## 4. "Where does the AI model get its data?"
**Answer:** "For the hackathon, we trained an XGBoost model on a synthetic dataset of 100,000 transactions mimicking e-commerce behavior (based on standard Kaggle fraud datasets). In production, the model utilizes federated learning across our merchant network, learning from cross-merchant fraud rings."
