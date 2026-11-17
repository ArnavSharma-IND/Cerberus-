# ── Stage 1: Build Lavender React Frontend ─────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python Cerberus Runtime Proxy ────────────────────────
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

COPY pyproject.toml README.md ./
COPY src/ ./src
COPY policies/ ./policies

RUN uv pip install --system -e .

# Copy compiled frontend from Stage 1 into the location expected by FastAPI
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Ensure Python can always locate the cerberus package
ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

# Non-root security posture
RUN adduser --disabled-password --gecos '' cerberus && chown -R cerberus:cerberus /app
USER cerberus

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-8000}/healthz || exit 1

CMD ["sh", "-c", "uvicorn cerberus.proxy.server:app --host 0.0.0.0 --port ${PORT:-8000}"]
