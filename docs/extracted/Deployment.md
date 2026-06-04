# Deployment

Deployment targets
- Docker Compose for self-hosted deployments
- Cloud platforms (Vercel for frontend, AWS/GCP for backend)
- Kubernetes for large-scale, multi-tenant hosting

Docker
- Build and tag images for frontend and backend
- Use docker-compose.yml included in repo for local orchestration

Environment variables
- Ensure required env vars are set (see Quickstart)
- Use secrets manager in production (AWS Secrets Manager, Vault)

CI/CD
- Build containers in CI; run tests; push to registry
- Use migrations for database schema changes

Database migrations
- Use a migration tool (Prisma/Migrate, TypeORM migrations) depending on ORM

Scaling
- Scale workers separately for heavy webhook processing
- Use managed DB for production-scale reliability
