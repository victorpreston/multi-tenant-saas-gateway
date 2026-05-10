# Multi-Tenant SaaS Gateway

A production-grade, enterprise-scale **Multi-Tenant SaaS API Gateway** built with **NestJS**, featuring complete tenant isolation, role-based access control, webhook delivery, audit logging, and end-to-end security.

---

## Architecture

<p align="center">
  <img src="docs/images/architecture.png" alt="System Architecture Diagram" width="700" />
</p>

---

## Key Features

| Feature | Details |
|---|---|
| **Multi-Tenancy** | Complete data isolation at DB, cache, and event layers |
| **Authentication** | JWT access + refresh tokens, API key auth |
| **RBAC** | Role-based access control with tenant-scoped roles and permissions |
| **Webhooks** | Register endpoints, HMAC-SHA256 signed payloads, retry logic |
| **Password Reset** | Secure token-based reset flow, SHA-256 hashed, 60-min expiry |
| **Audit Logs** | Every state-changing action recorded with who/what/when |
| **Pagination & Search** | All list endpoints paginated; users/tenants support `?q=` and `?status=` |
| **Tenant Onboarding** | Default admin/member/viewer roles auto-created on tenant registration |
| **Compression** | Gzip response compression |
| **Security Headers** | Helmet, CORS with env-configured origins |
| **Rate Limiting** | Global throttling via Redis |
| **Health Checks** | `/api/health` and `/api/ready` with live DB ping |
| **Event Streaming** | Apache Kafka for async domain events |
| **Caching** | Redis with automatic cache invalidation |
| **Observability** | Prometheus + Grafana, structured request logging, correlation IDs |
| **Kubernetes Ready** | Helm charts, HPA (3–10 replicas), liveness/readiness probes |

---

## Quick Start

```bash
git clone https://github.com/victorpreston/multi-tenant-saas-gateway
cd multi-tenant-saas-gateway

cp .env.example .env

# Start PostgreSQL, Redis, Kafka, Prometheus, Grafana
npm run docker:up

npm install
npm run start:dev
```

- API: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/api/docs`
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

---

## API Endpoints

All routes are prefixed with `/api`. Pass `x-tenant-id` header on all protected routes.

### Auth — `POST /api/auth/...`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register a new user in a tenant |
| POST | `/login` | — | Authenticate and receive JWT tokens |
| POST | `/refresh` | — | Exchange refresh token for new access token |
| GET | `/me` | JWT | Get the current authenticated user |
| POST | `/forgot-password` | — | Request a password reset token |
| POST | `/reset-password` | — | Reset password using a valid token |
| POST | `/change-password` | JWT | Change password (requires current password) |

### Tenants — `GET/POST/PUT/DELETE /api/tenants/...`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create a new tenant (triggers onboarding) |
| GET | `/?page=1&limit=20&q=acme&status=ACTIVE` | List tenants (paginated, searchable) |
| GET | `/:id` | Get tenant by ID |
| PUT | `/:id` | Update tenant |
| DELETE | `/:id` | Delete tenant |

### Users — `GET/POST/PUT/DELETE /api/users/...` *(JWT, tenant-scoped)*

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create user in current tenant |
| GET | `/?page=1&limit=20&q=john&status=ACTIVE` | List users (paginated, searchable) |
| GET | `/:id` | Get user by ID |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Delete user |

### Profile — `/api/profile` *(JWT)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get authenticated user's profile |
| PATCH | `/` | Update profile (name) |

### API Keys — `/api/api-keys` *(JWT)*

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create API key |
| GET | `/` | List all API keys |
| GET | `/:id` | Get API key |
| PATCH | `/:id` | Update API key |
| POST | `/:id/rotate` | Rotate secret |
| POST | `/:id/revoke` | Revoke key |
| DELETE | `/:id` | Delete key |

### Webhooks — `/api/webhooks` *(JWT)*

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Register a webhook endpoint |
| GET | `/` | List webhooks for current tenant |
| GET | `/:id` | Get webhook by ID |
| PATCH | `/:id` | Update webhook (url, events, active) |
| DELETE | `/:id` | Delete webhook |
| POST | `/:id/rotate-secret` | Rotate HMAC signing secret |
| POST | `/:id/test` | Send a test delivery |

Webhook payloads are signed with `x-webhook-signature: sha256=<hmac>`. Events:  
`tenant.created`, `tenant.updated`, `tenant.deleted`, `user.created`, `user.updated`, `user.deleted`, `api_key.created`, `api_key.revoked`

### RBAC — `/api/rbac` *(JWT)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/permissions` | List all available permissions |
| GET | `/roles` | List roles for current tenant |
| POST | `/roles` | Create a role |
| DELETE | `/roles/:roleId` | Delete a role |
| POST | `/users/:userId/roles` | Assign role to user |
| DELETE | `/users/:userId/roles/:roleId` | Remove role from user |
| GET | `/users/:userId/roles` | Get roles for a user |

### Audit Logs — `/api/audit-logs` *(JWT)*

| Method | Path | Description |
|--------|------|-------------|
| GET | `/?page=1&limit=50&action=user.create&status=SUCCESS&from=2026-01-01&to=2026-12-31` | Query audit logs |

### Health — `/api/health`, `/api/ready`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Liveness probe (checks DB connectivity) |
| GET | `/api/ready` | Readiness probe (checks DB connectivity) |

---

## Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# CORS (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Database (PostgreSQL)
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=gateway_user
DATABASE_PASSWORD=gateway_password
DATABASE_NAME=saas_gateway_db
DATABASE_SSL=false

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# JWT — generate with: node -e "require('crypto').randomBytes(32).toString('hex')"
JWT_SECRET=<strong-secret>
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=<strong-refresh-secret>
JWT_REFRESH_EXPIRATION=7d

# Kafka
KAFKA_BROKERS=kafka:29092
KAFKA_GROUP_ID=saas-gateway

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Webhooks
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_MAX_RETRIES=3
```

Full reference: `.env.example`

---

## Database

### Entities

| Entity | Purpose |
|---|---|
| `Tenant` | Core multi-tenancy unit |
| `User` | Tenant-scoped user accounts |
| `Role` | RBAC roles (admin, member, viewer) |
| `Permission` | Granular resource:action permissions |
| `ApiKey` | API authentication credentials |
| `AuditLog` | Immutable compliance trail |
| `Webhook` | Registered webhook endpoints |
| `PasswordResetToken` | Secure password reset tokens (60-min TTL) |

### Migrations

```bash
npm run db:migrate          # Run pending migrations
npm run db:migrate:create   # Create a new migration file
npm run db:reset            # Revert all + re-run + seed
```

---

## Testing

```bash
npm run test          # Unit tests
npm run test:cov      # Unit tests with coverage report
npm run test:e2e      # End-to-end tests
npm run test:watch    # Watch mode
```

**126 unit tests** across 16 test suites covering:
- All service layer logic (auth, users, tenants, RBAC, audit, webhooks, profile, onboarding)
- Global exception filter (including PostgreSQL error codes)
- Tenant middleware (header extraction, subdomain fallback)
- Pagination DTO calculations
- HMAC webhook signature verification

---

## CI/CD

| Workflow | Trigger | Jobs |
|---|---|---|
| **PR Checks** (ci.yml) | push / PR to `master`, `dev` | lint, format, build, type-check, unit tests with coverage |
| **Docker Build** (build.yml) | push / PR to `master`, `dev` | build image; push to GHCR on merge |
| **Security Scan** (security.yml) | push / PR + weekly | npm audit (report only) |

---

## Infrastructure

### Docker (local dev)

```bash
npm run docker:up    # Start all services
npm run docker:down  # Stop all services
npm run docker:logs  # Tail logs
```

Services: PostgreSQL, Redis, Kafka, Zookeeper, Prometheus, Grafana, NestJS app

### Kubernetes

```bash
aws eks update-kubeconfig --region us-east-1 --name saas-gateway-eks

kubectl create secret generic db-secret \
  --from-literal=username=gateway_user \
  --from-literal=password=your-db-password \
  -n saas-gateway

kubectl apply -f k8s/
```

Deployment: 3 replicas, HPA 3→10 on 70% CPU / 80% memory, rolling updates with zero downtime.

### Terraform (AWS)

```bash
cd infrastructure/
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform plan
terraform apply
```

Provisions: VPC, EKS, RDS PostgreSQL, ElastiCache Redis, security groups, IAM roles (~$138/mo).  
See [infrastructure/infrastructure.md](infrastructure/infrastructure.md) for details.

---

## Monitoring

| Tool | URL | Purpose |
|---|---|---|
| Grafana | `http://localhost:3001` | Dashboards (admin/admin — change in prod) |
| Prometheus | `http://localhost:9090` | Metrics collection |
| Swagger UI | `http://localhost:3000/api/docs` | Interactive API documentation |

---

## Scripts Reference

```bash
# Development
npm run start:dev       # Hot-reload dev server
npm run start:debug     # Debug mode
npm run start:prod      # Production server

# Code quality
npm run lint            # ESLint with auto-fix
npm run lint:check      # ESLint check only
npm run format          # Prettier format
npm run format:check    # Prettier check only

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed data
npm run db:reset        # Reset + migrate + seed

# Docker
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs

# Git
npm run commit          # Commitizen guided commit
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch strategy, commit conventions, and code standards.

---

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Documentation](https://typeorm.io)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
