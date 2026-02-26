FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --production=false

# Copy source
COPY src/ src/
COPY workers/ workers/
COPY tsconfig.json ./

# Install tsx for direct TS execution
RUN npm install -g tsx

# Health check endpoint (curl-based)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD test -f /tmp/worker-heartbeat && \
      [ $(( $(date +%s) - $(cat /tmp/worker-heartbeat) )) -lt 60 ] || exit 1

# Default: process all tool types
ENV TOOL_TYPE=""
ENV POLL_INTERVAL_MS=2000
ENV MAX_CONCURRENT=5

CMD ["tsx", "workers/generation-worker.ts"]
