# Payment flow

The intended flow is Firebase-authenticated Next.js request -> FastAPI token verification -> tenant lookup -> Razorpay Orders API -> local order and transaction persistence -> Razorpay Checkout -> server-side signature verification -> webhook state synchronization.

The implemented slice currently covers token-derived user/workspace provisioning, tenant-scoped metrics and transaction/dispute reads, and server-side Razorpay TEST order creation. It does not claim a complete payment lifecycle until checkout, verification, webhook idempotency, and database synchronization are implemented and tested against Razorpay TEST MODE.
