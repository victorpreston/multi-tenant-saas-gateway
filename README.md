<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

A production-grade, enterprise-scale **Multi-Tenant SaaS Gateway** built with **NestJS**, featuring advanced API management, real-time analytics, multi-tenancy isolation, and comprehensive compliance capabilities.

### Key Features

✅ **Multi-Tenancy** - Complete tenant isolation at all layers (database, cache, events)  
✅ **Enterprise-Grade API Gateway** - Kong integration, request routing, authentication  
✅ **Real-time Analytics** - Prometheus + TimescaleDB + Grafana dashboards  
✅ **Rate Limiting** - Per-tenant and per-user rate limiting with Redis  
✅ **Event Streaming** - Apache Kafka for audit logs and async processing  
✅ **Monitoring & Observability** - Comprehensive metrics collection and alerting  
✅ **RBAC** - Role-Based Access Control with PostgreSQL  
✅ **Kubernetes Ready** - Docker & Kubernetes manifests included  
✅ **Conventional Commits** - Husky hooks, commitlint, lint-staged  
✅ **High Availability** - No single point of failure, auto-scaling ready  

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 + TimescaleDB (metrics)
- **Cache**: Redis 7
- **Events**: Apache Kafka 7.5
- **Monitoring**: Prometheus + Grafana
- **Testing**: Jest
- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky + Commitizen
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (ready)

## Quick Start

### Prerequisites

- Node.js 20.x+
- Docker & Docker Compose
- Git 2.40.x+

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd multi-tenant-saas-gateway

# 2. Install dependencies
npm install

# 3. Setup Husky hooks
npm run prepare

# 4. Copy environment file
cp .env.example .env.development.local

# 5. Start services (PostgreSQL, Redis, Kafka, Prometheus, Grafana)
npm run docker:up

# Wait 30-60 seconds for services to be ready

# 6. Start development server
npm run start:dev
```

Application will be available at `http://localhost:3000`

## Available Scripts

### Development

```bash
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debugger
npm run format             # Format code
npm run lint               # Lint with fixes
npm run commit             # Interactive commit
```

### Testing

```bash
npm run test               # Unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests
```

### Docker

```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:logs        # View logs
```

### Production

```bash
npm run build              # Build application
npm run start:prod         # Start production
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

## Architecture

```
┌──────────────────────────────────────────────────┐
│              CLIENT REQUESTS                     │
└─────────────────────┬────────────────────────────┘
                      ▼
        ┌─────────────────────────────┐
        │  Kubernetes Load Balancer   │
        │ (Nginx Ingress Controller)  │
        └────────────┬────────────────┘
                     ▼
        ┌────────────────────────────────────┐
        │  KONG API GATEWAY CLUSTER          │
        │  - Authentication & Authorization  │
        │  - Rate Limiting (Redis)           │
        │  - Request Routing                 │
        │  - Multi-tenant Isolation          │
        └────────────┬──────────────────────┘
            ┌────────┴─────────┐
            ▼                  ▼
       ┌─────────┐       ┌──────────────┐
       │ Redis   │       │ NestJS API   │
       │ Cache   │       │ Services     │
       └─────────┘       └──────┬───────┘
                                ▼
               ┌────────────────────────────┐
               │  PostgreSQL + TimescaleDB  │
               │  - User & Tenant Data      │
               │  - Metrics & Analytics     │
               └────────────────────────────┘
                                ▼
               ┌────────────────────────────┐
               │  Apache Kafka              │
               │  - Event Streaming         │
               │  - Audit Logs              │
               └────────────┬───────────────┘
            ┌──────────────┴──────────────┐
            ▼                             ▼
    ┌──────────────┐           ┌─────────────────┐
    │ Prometheus   │           │ Kafka Consumers │
    │ (Monitoring) │           │ - Analytics     │
    └──────┬───────┘           │ - Billing       │
           ▼                    │ - Audit Trail   │
    ┌──────────────┐           └─────────────────┘
    │ Grafana      │
    │ (Dashboards) │
    └──────────────┘
```

## Project Structure

```
.
├── src/                             # Source code
│   ├── main.ts
│   ├── app.module.ts
│   └── modules/
├── test/                            # E2E tests
├── config/                          # Configuration files
│   ├── init-db.sql
│   ├── prometheus.yml
│   └── alerts.yml
├── k8s/                             # Kubernetes manifests (AWS EKS)
│   ├── README.md
│   ├── namespace.yml
│   ├── app/
│   ├── database/
│   ├── cache/
│   └── monitoring/
├── infrastructure/                  # Terraform (AWS IaC)
│   ├── README.md
│   ├── main.tf
│   ├── vpc.tf
│   ├── rds.tf
│   ├── eks.tf
│   ├── security.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── Dockerfile                       # Production image
├── docker-compose.yml               # Local dev stack
├── .gitattributes                   # Git settings
├── .prettierrc.json                 # Code formatter config
├── commitlint.config.js             # Commit rules
├── DEVELOPMENT.md                   # Development guide
├── CONTRIBUTING.md                  # Contribution guidelines
└── package.json                     # Dependencies
```

## Services

| Service | Port | Purpose |
|---------|------|---------|
| NestJS App | 3000 | Main API application |
| PostgreSQL | 5432 | Primary application database |
| Redis | 6379 | Caching & rate limiting |
| Kafka | 9092 | Event streaming |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards & monitoring |

## Database

### Initialization

The database is automatically initialized when PostgreSQL container starts. Schema includes:

- **Tenants**: Multi-tenant isolation
- **Users**: User accounts with RBAC
- **Roles**: Role-based access control
- **API Keys**: API authentication keys
- **Metrics** (TimescaleDB): Request metrics & analytics
- **Audit Logs** (TimescaleDB): Compliance & audit trail

### Connecting

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U gateway_user -d saas_gateway_db

# View tables
\dt

# View TimescaleDB hypertables
SELECT * FROM timescaledb_information.hypertables;
```

## Monitoring

### Prometheus
- Dashboard: `http://localhost:9090`
- Query language: PromQL
- Scrape interval: 15s

### Grafana
- Dashboard: `http://localhost:3001`
- Default credentials: admin/admin ⚠️ (Change in production!)
- Pre-configured data source: Prometheus

### Metrics

Key metrics collected:
- Request latency (p50, p95, p99)
- Error rates by tenant
- Gateway throughput
- Resource usage (CPU, memory)
- Database performance
- Rate limit hits

## Development

For detailed development instructions, see [DEVELOPMENT.md](DEVELOPMENT.md)

### Code Standards

- **Linting**: ESLint with auto-fix
- **Formatting**: Prettier (100-character line length)
- **Commits**: Conventional Commits (Commitizen + Commitlint)
- **Pre-commit hooks**: Husky (lint-staged)
- **Testing**: Jest with coverage reporting

### Git Workflow

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Interactive commit
npm run commit

# Or direct
git commit -m "feat(auth): add JWT validation"
```

**Commit types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`

## Environment Variables

See [.env.example](.env.example) for all available variables:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=postgres
DB_USER=gateway_user
DB_PASSWORD=gateway_password
DB_NAME=saas_gateway_db

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=redis_password

# Kafka
KAFKA_BROKERS=kafka:29092

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# Rate Limiting
RATE_LIMIT_GLOBAL=1000
RATE_LIMIT_PER_TENANT=500
RATE_LIMIT_PER_USER=100
```

## Production

### Building

```bash
npm run build
docker build -t multi-tenant-saas-gateway:latest .
```

### AWS Infrastructure (Terraform)

Deploy complete AWS infrastructure with Terraform:

```bash
cd infrastructure/
terraform init
terraform plan
terraform apply
```

See [infrastructure/README.md](infrastructure/README.md) for detailed instructions.

**Creates:**
- VPC with public/private subnets
- EKS Kubernetes cluster
- RDS PostgreSQL database
- ElastiCache Redis cluster
- Security groups and IAM roles

### Kubernetes Deployment

Deploy to EKS cluster:

```bash
# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name saas-gateway-eks

# Create secrets
kubectl create secret generic db-secret \
  --from-literal=username=gateway_user \
  --from-literal=password=your-password \
  -n saas-gateway

# Deploy
kubectl apply -f k8s/
```

See [k8s/README.md](k8s/README.md) for detailed instructions.

## Contributing

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes and test
3. Commit: `npm run commit`
4. Push: `git push origin feat/your-feature`
5. Create Pull Request

## Security

 **Important**:
- Never commit `.env` files (use `.env.example`)
- Rotate JWT secrets in production
- Use HTTPS in production
- Enable RBAC for all tenants
- Keep dependencies updated
- Review Docker images for vulnerabilities

## Troubleshooting

### Services won't start

```bash
docker-compose down -v
npm run docker:up
```

### Port already in use

Change ports in `.env.development.local` or docker-compose.yml

### Database connection errors

```bash
docker-compose logs postgres
docker-compose exec postgres psql -U gateway_user -d saas_gateway_db -c "SELECT 1"
```

### Redis connection errors

```bash
docker-compose logs redis
docker-compose exec redis redis-cli -a redis_password ping
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)


