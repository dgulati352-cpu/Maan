# ==============================================================================
# ShaadiSnap AI - Production Face Recognition Inference Container
# ==============================================================================
FROM python:3.11-slim AS runtime

# Set environmental flags
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

# Install runtime system libraries required by OpenCV and scientific packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create dedicated non-root application user
RUN useradd -m -u 1001 -s /bin/bash shaadisnap
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application source code and configurations
COPY src/ ./src/
COPY api/ ./api/
COPY configs/ ./configs/
COPY checkpoints/ ./checkpoints/

# Set proper ownership
RUN chown -R shaadisnap:shaadisnap /app
USER shaadisnap

EXPOSE 8000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production WSGI server
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
