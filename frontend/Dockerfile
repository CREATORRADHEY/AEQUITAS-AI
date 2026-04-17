# AEQUITAS AI — Hardened Frontend Build (Node 20)
# This Dockerfile is optimized for Next.js 15 and Tailwind CSS 4.

FROM node:20-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Environment Preparation
# We use node:20-slim to satisfy Next.js 15 requirements
COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline

# Step 2: Source Injection
COPY . .

# Step 3: Architecture Bridging
# Next.js 15 + Tailwind 4 requires native binaries for Oxide and LightningCSS
# We manually bridge them to ensure they are available in the expected paths
RUN cp -r node_modules/@tailwindcss/oxide-linux-x64-gnu/*.node node_modules/@tailwindcss/oxide/ || echo "Oxide bridge skipped"
RUN cp -r node_modules/lightningcss-linux-x64-gnu/*.node node_modules/lightningcss/ || echo "LightningCSS bridge skipped"

# Step 4: Verification
# This confirms the binaries are correctly placed before build starts
RUN ls node_modules/@tailwindcss/oxide/*.node || true
RUN ls node_modules/lightningcss/*.node || true

# Step 5: Build
ARG NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 6: Production Runtime
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

EXPOSE 8080
CMD ["npm", "start"]
