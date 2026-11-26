# syntax=docker/dockerfile:1
# -----------------------------------------------------------------------------
# CampusWay Backend Production Dockerfile (Python 3.12 Multi-stage)
# Build Context: Repository Root (.) to ensure migration discovery
# -----------------------------------------------------------------------------

# Stage 1: Build dependencies and compile wheels
FROM python:3.12-slim AS builder

WORKDIR /build

# Install build dependencies for native wheels (e.g. psycopg2, argon2-cffi)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt

# Stage 2: Minimal runtime image
FROM python:3.12-slim AS runtime

# Environment variables for unbuffered logging and bytecode suppression
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000 \
    PYTHONPATH=/app/backend

# Create non-root system user for secure container execution
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/bash -m appuser

# Install runtime PostgreSQL client library and networking tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies from builder wheels
COPY --from=builder /build/wheels /wheels
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels requirements.txt

# Copy application source, migrations directory, and alembic configs with non-root ownership
COPY --chown=appuser:appuser backend /app/backend
COPY --chown=appuser:appuser database/migrations /app/database/migrations
COPY --chown=appuser:appuser alembic.ini /app/alembic.ini

WORKDIR /app/backend

USER appuser

EXPOSE 8000

# Built-in health check validating backend service availability
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Production ASGI server launch with graceful shutdown timeout
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "5"]
