# CampusWay — Production Deployment Guide

## 1. Overview
This document outlines production deployment strategies for the CampusWay backend service, including containerized deployments via Docker Compose and cloud PaaS/CaaS platforms (e.g. AWS ECS, Google Cloud Run, Render, Fly.io) paired with Neon Cloud PostgreSQL.

---

## 2. Docker Compose Deployment

### 2.1 Configuration
The repository includes a hardened `docker-compose.yml` defining:
1. `postgres`: PostgreSQL 16 Alpine with automatic health checks (`pg_isready`).
2. `backend`: FastAPI Python 3.12 slim container with non-root user execution (`appuser:appuser`), health checks on `/health`, and dependencies linked to PostgreSQL health.
3. `frontend`: Next.js 15 client depending on backend service availability.

### 2.2 Launching the Stack
```bash
# Start all containers in detached mode
docker compose up -d --build

# View real-time logs
docker compose logs -f backend

# Verify health status
docker compose ps
```

---

## 3. Cloud Database Configuration (Neon PostgreSQL)

CampusWay is configured for shared Neon cloud database connectivity:
- **Connection String Format**:
  ```
  postgresql://<username>:<password>@<neon-hostname>/<dbname>?sslmode=require
  ```
- **Connection Pooling**: SQLAlchemy pool sizing is tuned in `backend/app/core/config.py`:
  - `SQLALCHEMY_POOL_SIZE = 5`
  - `SQLALCHEMY_MAX_OVERFLOW = 10`
  - `SQLALCHEMY_POOL_RECYCLE = 300` (Recycle idle connections every 5 minutes to prevent Neon serverless connection drops)
- **Zero Destructive Migrations**: Production cloud databases must strictly apply incremental Alembic migrations (`alembic upgrade head`).

---

## 4. Production Security Checklist

| Check | Action Required | Verified |
| :--- | :--- | :---: |
| **Secret Keys** | Replace default `ADMIN_API_KEY` and `JWT_SECRET_KEY` with cryptographically random strings (min 64 chars). | [ ] |
| **CORS Restriction** | Set `CORS_ORIGINS` to exact trusted production domain(s) (e.g. `["https://campusway.lpu.in"]`). | [ ] |
| **HTTPS Only** | Enforce TLS 1.3 at reverse proxy (Nginx, Traefik, or Cloudflare). | [ ] |
| **Non-Root Execution**| Verified: Backend Dockerfile runs as unprivileged user `appuser` (UID 10001). | [x] |
| **Secrets in Images** | Verified: No `.env` files or credentials are baked into Docker images. | [x] |
| **Health Check** | Configure load balancer / Kubernetes liveness probe to poll `GET /health`. | [ ] |
| **Graceful Shutdown** | ASGI server responds to `SIGTERM` and `SIGINT` cleanly draining in-flight requests. | [x] |

---

## 5. Health Monitoring & Observability

- **Liveness & Readiness Endpoint**: `GET /health`  
  Returns:
  ```json
  {
    "status": "healthy",
    "service": "CampusWay Route Intelligence Service",
    "version": "0.1.0"
  }
  ```
- **Interactive Documentation**: Available in development at `/api/v1/docs`. Disable in high-security production environments if desired by passing `docs_url=None, redoc_url=None` in `app/main.py`.
