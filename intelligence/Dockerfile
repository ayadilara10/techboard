# intelligence/Dockerfile — TechBoard Flask Intelligence Engine
#
# Uses python:3.12-slim: Debian-based, no unnecessary packages,
# suitable for numpy/scipy which require a C toolchain at build time.

FROM python:3.12-slim

# Install system-level build dependencies required by numpy and scipy.
# These are only needed at pip install time; they are NOT removed afterwards
# in this build because removing them after install (multi-stage or apt purge)
# would not reduce size significantly for this service.
RUN apt-get update && apt-get install -y --no-install-recommends \
      gcc \
      build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first to exploit Docker layer caching
COPY requirements.txt ./

# Install Python dependencies
# --no-cache-dir: don't store the pip wheel cache inside the image
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the service code
COPY . .

# Flask listens on port 5001
EXPOSE 5001

# Health check: Node.js backend and Docker both call /intelligence/health
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5001/intelligence/health')" || exit 1

# Start the Flask development server.
# For production traffic, swap CMD to:
#   gunicorn --bind 0.0.0.0:5001 --workers 2 app:app
CMD ["python", "app.py"]
