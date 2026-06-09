# Development Roadmap

Prioritized module audit with effort estimates for the PSAiPay platform.

## Priority 1: Critical (Should Do Next)

| Task | Module | Effort | Impact |
|------|--------|--------|--------|
| Add database migrations (drizzle-kit) | DB | 1 day | Reliable schema management |
| Add unit tests for route handlers | API | 3 days | Prevent regressions |
| Add integration tests for slip verifier | API | 2 days | Verify 9-step pipeline |
| Add HTTPS/TLS termination (nginx/Caddy) | Infra | 1 day | Production security |
| Add request logging middleware | API | 0.5 day | Debugging and audit |
| Configure postgres.js connection pool | DB | 0.5 day | Production reliability |

## Priority 2: Important (Next Quarter)

| Task | Module | Effort | Impact |
|------|--------|--------|--------|
| Multi-user authentication with roles | Auth | 5 days | Team access management |
| Merchant-facing API (self-service) | API | 5 days | Scale merchant onboarding |
| Automated notification system (email/SMS) | Notifications | 3 days | Payment confirmation flow |
| Pagination on all list endpoints | API | 1 day | Performance at scale |
| File upload for slip images (multipart) | API | 1 day | Better UX than base64 |
| CI/CD pipeline (GitHub Actions) | Infra | 2 days | Automated testing and deployment |
| Production deployment guide | Docs | 1 day | Onboarding new developers |

## Priority 3: Enhancement (Future)

| Task | Module | Effort | Impact |
|------|--------|--------|--------|
| OpenCV.js for logo detection | Slip Verifier | 3 days | Better logo matching accuracy |
| DCT-based perceptual hash | Slip Verifier | 2 days | Better near-duplicate detection |
| Dashboard WebSocket for real-time updates | Dashboard | 3 days | Live payment status |
| Merchant webhook retry with backoff | API | 2 days | Reliable merchant notifications |
| Audit log table and middleware | API | 2 days | Compliance and debugging |
| Rate limiting on all API endpoints | API | 1 day | Abuse prevention |
| CSRF protection for cookie-based auth | Auth | 1 day | Additional security layer |
| Mobile-responsive dashboard | Dashboard | 3 days | Mobile admin access |
| Bank sandbox integration tests | API | 2 days | Validate callback flow |

## Module Audit Results

| Module | Lines of Code | Test Coverage | Status |
|--------|-------------|---------------|--------|
| api-server/routes | ~600 | 0% | Functional, needs tests |
| api-server/lib/promptpay | ~50 | 0% | Functional |
| api-server/lib/slip-verifier | ~500 | 0% | New, needs tests |
| api-server/middleware | ~20 | 0% | Functional |
| psai-dashboard/pages | ~800 | 0% | Functional |
| lib/db/schema | ~120 | 0% | Functional |
| lib/db/client | ~8 | 0% | Functional |

## Technology Decisions

| Decision | Rationale | Trade-off |
|----------|-----------|-----------|
| Express monolith (not microservices) | Simple deployment, small team | Harder to scale individual modules |
| Drizzle ORM (not Prisma/TypeORM) | Lightweight, SQL-like, good TypeScript | Less abstraction, more SQL knowledge needed |
| Tesseract.js (not cloud OCR) | No external dependency, runs locally | Slower, lower accuracy than cloud APIs |
| sharp for ELA (not OpenCV.js) | Smaller binary, simpler API | Less sophisticated image analysis |
| pnpm workspaces (not Lerna/Nx) | Fast, simple, native monorepo | Less tooling than Nx |
| Ant Design (not custom UI) | Fast development, professional look | Less customization, larger bundle |

## Estimated Capability After Priority 1

- All data persisted and queryable in PostgreSQL
- Critical security holes fixed
- 9-step slip verification at ~75-80% accuracy (up from ~45%)
- Basic test coverage for regression prevention
- Production-ready deployment configuration
