# Architecture

High-level components
- Frontend: React (or Next.js) single-page app for customer interactions and admin dashboard.
- Backend: Node/Express (or Nest) API that handles authentication, payments, and webhooks.
- Database: Postgres SQL for persistent data (customers, subscriptions, invoices).
- Worker: Background job processor (Bull/Redis or Sidekiq-like) for async tasks (webhook delivery, retries).
- Payment Gateways: Stripe, PayPal, optional adapters for other providers.

Deployment targets
- Docker Compose for self-hosted deployments
- Cloud platforms: Vercel/Netlify (frontend), Heroku/AWS/GCP (backend)
- Kubernetes manifests for large scale deployments

Security
- Store secrets in host env (do not commit .env files)
- Use gateway tokenization; never store full card numbers
- Webhooks: validate signatures and use environment-specific keys

Data flow
1. Customer initiates checkout on the frontend.
2. Frontend creates a payment intent via backend and sends to gateway.
3. Gateway returns confirmation; backend records transaction and invoice.
4. Worker handles subscription renewals and webhook events.
