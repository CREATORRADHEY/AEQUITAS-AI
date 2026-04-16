# --- Hardened Next.js Dockerfile (Stabilized) ---

# Stage 1: Dependencies
FROM node:18-slim AS deps
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
# Use --legacy-peer-deps to handle React 19 / Next 15 / Framer-Motion / Lucide resolution conflicts
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:18-slim AS builder
WORKDIR /app
ARG NODE_OPTIONS
ENV NODE_OPTIONS=$NODE_OPTIONS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Ensure standalone output is generated
RUN npm run build

# Stage 3: Runner
FROM node:18-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Setup user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy essential files for standalone runtime
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Note: server.js is the entrypoint for Next.js standalone mode
CMD ["node", "server.js"]
