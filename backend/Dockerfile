# backend/Dockerfile — TechBoard Node.js API
#
# Multi-stage build is not needed here (no TypeScript compile step), so we use
# a single stage to keep the image small and the build fast.
#
# The node:20-alpine base keeps the final image under 200 MB; it includes npm
# and node but omits build tools that are not required at runtime.

FROM node:20-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json first so Docker can cache the npm install layer.
# As long as package.json does not change, `npm ci` won't re-run.
COPY package.json ./

# Install only production dependencies (excludes nodemon, etc.)
# npm ci is preferred over npm install in CI/Docker builds:
#   - reads package-lock.json for reproducible installs
#   - fails if lock file is out of sync with package.json
RUN npm install --omit=dev

# Copy the rest of the application code AFTER installing dependencies
# so code changes don't invalidate the npm install cache layer.
COPY . .

# The API listens on PORT (default 3000, overridable via env in docker-compose)
EXPOSE 3000

# Health check: Docker periodically hits /health and restarts the container
# if it keeps returning non-200 responses.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the server
CMD ["node", "server.js"]
