# Hyperswitch - AI Risk Manager Fork

A composable, open-source payments infrastructure built in Rust. 

> **Notice**: This repository is a fork of the [Hyperswitch](https://github.com/juspay/hyperswitch) project originally developed by Juspay Technologies. It is maintained by Dinesh Kumar as part of an independent project.

## What Is This?

This application is a highly scalable, robust payment routing and orchestration engine. It acts as a unified API layer that connects to over 100 payment processors worldwide (like Stripe, Adyen, PayPal, and more). 

It is designed for businesses that need to route payments intelligently across multiple processors to reduce costs, improve success rates, and avoid vendor lock-in. 

### The Problem
When a business scales, relying on a single payment processor (like Stripe alone) becomes risky and expensive. If the processor goes down, the business stops making money. If the processor charges high fees for certain regions, the business loses margin. Managing multiple payment integrations natively is incredibly complex and requires significant engineering effort.

### The Solution
This infrastructure abstracts away the complexity of integrating with multiple payment processors. You integrate once with this system, and you instantly get access to over 100+ gateways. It handles smart routing, retries, and securely vaulting payment methods.

### Why This Project Matters
It democratizes access to enterprise-grade payment infrastructure. By open-sourcing the core routing logic, developers can build reliable payment flows without building an entire payment engineering team from scratch.

## Key Features

- **Intelligent Routing**: Route transactions across multiple PSPs to optimize for success rate and cost.
- **Unified API**: A single integration point for 100+ payment processors.
- **PCI-Compliant Vaulting**: Securely store customer cards and payment methods in a central vault, decoupling them from any specific gateway.
- **Smart Retries**: Automatically retry failed payments on alternative processors.
- **Observability**: Detailed metrics and logging for all payment attempts.

## How the Application Works

### User Flow
1. A customer initiates a checkout on the merchant's application.
2. The merchant's backend calls the API to create a payment intent.
3. The application determines the best payment processor to use based on configured routing rules (e.g., cost, region, historical success rate).
4. The application securely communicates with the chosen processor to authorize the payment.
5. The result is returned to the merchant, and webhooks are fired for asynchronous updates.

### System Architecture

```mermaid
flowchart TD
    Client[Client App] --> API[Payment Router API]
    API --> Vault[Card Vault Service]
    API --> DB[(PostgreSQL)]
    API --> Cache[(Redis)]
    API --> Connectors[Payment Connectors]
    Connectors --> Stripe[Stripe]
    Connectors --> Adyen[Adyen]
    Connectors --> PayPal[PayPal]
    API --> Async[Background Workers]
```

## Technology Stack

- **Backend**: Rust (Actix-web framework)
- **Database**: PostgreSQL
- **Caching & Queues**: Redis
- **Infrastructure**: Docker, Kubernetes (Helm)
- **Monitoring**: OpenTelemetry, Prometheus, Loki

## Project Structure

- `crates/`: Contains all the Rust workspaces (the core application logic).
  - `router/`: The main API server.
  - `storage_impl/`: Database interactions.
  - `hyperswitch_connectors/`: Integrations with external payment processors.
- `config/`: Application configuration files.
- `migrations/`: Database schema migrations.
- `docs/`: Documentation and architecture designs.

## Requirements

- **OS**: Linux or macOS
- **Git**: Required for version control
- **Docker & Docker Compose**: Required for running the database and services locally
- **Rust**: `1.85.0` or later (if building from source)
- **Just**: Command runner

## Installation & Running the Application

### Linux & macOS Setup

The easiest way to run the application locally is using Docker Compose. 

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd "AI RISK MANAGER"
   ```

2. **Run the setup script:**
   ```bash
   bash scripts/setup.sh
   ```
   This script will start the PostgreSQL database, Redis, and the router using Docker Compose.

3. **Verify the server is running:**
   ```bash
   curl http://localhost:8080/health
   ```

### Running from Source (Development Mode)

If you want to compile and run the Rust application directly:

1. **Start the dependencies (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d pg redis-standalone
   ```

2. **Run database migrations:**
   ```bash
   cargo install diesel_cli --no-default-features --features postgres
   diesel migration run --database-url=postgresql://db_user:db_pass@localhost:5432/hyperswitch_db
   ```

3. **Run the server:**
   ```bash
   cargo run --package router
   ```

## Environment Variables

The application is configured using TOML files located in the `config/` directory. For Docker setups, you can find the primary configuration in `config/docker_compose.toml`. 

A template `.env.example` is provided for overriding specific values when needed.

## API Overview

The router exposes a standard REST API. Here are some key endpoints:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST   | `/payments` | Create a new payment intent |
| GET    | `/payments/{id}` | Retrieve payment status |
| POST   | `/refunds` | Initiate a refund |
| POST   | `/customers` | Create a customer record |
| POST   | `/payment_methods` | Save a payment method to the vault |

## Security

- **Encryption**: Sensitive data (like card numbers) is encrypted before being stored in the database.
- **Authentication**: APIs are secured using API keys assigned to merchant accounts.
- **Secrets Management**: Configuration files are used, and no secrets are hardcoded in the source code.

## Troubleshooting

- **Database Connection Error**: Ensure PostgreSQL is running via Docker (`docker ps`). Check if port `5432` is already in use by another local Postgres instance.
- **Redis Connection Error**: Ensure Redis is running via Docker. Check port `6379`.
- **Rust Build Failures**: Ensure you are using the correct Rust version (`1.85.0`). Check `.cargo/config.toml` and your toolchain settings.

## Project Status

- **Development/Production-Ready**: The core routing engine is highly capable and heavily developed.

## Future Improvements

- Implementing the AI Risk Management layer for intelligent fraud detection and routing decisions.
- Adding more local development workflows and simplified configurations.

## About the Developer

**Dinesh Kumar**
AI / Full-Stack Developer

Dinesh Kumar is an AI / Full-Stack Developer focused on building intelligent, modern applications using artificial intelligence, machine learning, frontend engineering, backend systems, and modern web technologies. 

- **GitHub**: [INSERT GITHUB URL]
- **LinkedIn**: [INSERT LINKEDIN URL]
- **Portfolio**: [INSERT PORTFOLIO URL]
- **Email**: [INSERT EMAIL]

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

## Third-Party Notices

This project is a fork of the Hyperswitch project. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) for required attributions.
