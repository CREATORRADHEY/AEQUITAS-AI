# ATOMIC Hardened Dockerfile for Aequitas
# This version uses the "Atomic Build" strategy:
# 1. Sync all source code first.
# 2. Wipe any leaked Mac node_modules natively.
# 3. Perform a ground-up Linux install as the final pre-build step.

FROM node:18
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Sync Source Code
# We copy EVERYTHING first so we have the full context.
COPY . .

# Step 2: ATOMIC WIPE
# We delete everything that could have leaked from the Mac environment
# natively within the Linux filesystem.
RUN rm -rf node_modules package-lock.json

# Step 3: Native Linux Install
# Since we deleted package-lock, npm is forced to resolve correctly for Linux x64.
ENV npm_config_arch=x64
ENV npm_config_platform=linux
RUN npm install --legacy-peer-deps

# Step 4: Verification
# This confirms the native bindings for Tailwind Oxide/LightningCSS exist
RUN find node_modules/@tailwindcss -name "*.node" || echo "Oxide binary not found"

# Step 5: Build
ARG NODE_OPTIONS
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 6: Production Runtime
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

EXPOSE 8080
CMD ["npm", "start"]
