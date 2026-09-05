# Architecture Diagram

```mermaid
graph TD
    Client((Client Application))
    
    subgraph AI Risk Manager Platform
        Router[Rust Payment Router]
        Vault[PCI Card Vault]
        AI[AI Fraud Model]
        
        DB[(PostgreSQL)]
        Redis[(Redis Cache & Queues)]
        
        Router --> Vault
        Router --> AI
        Router --> DB
        Router --> Redis
    \end
    
    subgraph External Gateways
        Stripe[Stripe]
        Adyen[Adyen]
        PayPal[PayPal]
    \end
    
    Client -->|HTTPS / REST| Router
    Router -->|HTTPS| Stripe
    Router -->|HTTPS| Adyen
    Router -->|HTTPS| PayPal
```
