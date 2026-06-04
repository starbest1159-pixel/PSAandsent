# Quickstart

This page shows the minimal steps to run the project locally.

Prerequisites
- Node.js 18+ (or the version specified in .nvmrc)
- Docker (optional, recommended for DB)
- Yarn or pnpm
- Git

Clone repository
```bash
git clone https://github.com/starbest1159-pixel/PSAistudio-payment-website-SaaS.git
cd PSAistudio-payment-website-SaaS
```

Environment
- Copy .env.example to .env and fill required values:
  - PORT
  - DATABASE_URL (Postgres)
  - STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY (test keys for development)
  - PAYPAL_CLIENT_ID / PAYPAL_SECRET (sandbox)
  - JWT_SECRET
  - WEBHOOK_SECRET

Run locally (node)
```bash
yarn install
yarn dev
```

Run with Docker (recommended)
```bash
docker-compose up -d --build
```

CI/CD notes
- Docker builds for self-hosted deployments
- Cloud platforms: Vercel/AWS/GCP supported for frontend/backends

Tips
- Start with the Quickstart and follow the payment integration docs for gateway configuration.
