FROM python:3.12-slim AS runtime

# Prevent Python from writing .pyc files and enable unbuffered output for container logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Create non-root system user for secure container execution
RUN groupadd -g 10001 appuser && \
    useradd -u 10001 -g appuser -s /bin/bash -m appuser

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code with appropriate user ownership
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Built-in health check validating backend service availability
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Production ASGI server launch without development reload
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
