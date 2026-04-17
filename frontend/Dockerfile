# AEQUITAS AI — Hardened Frontend Build (Node 20)
FROM node:20-slim

# Install system dependencies for native builds
RUN apt-get update && apt-get install -y python3 make g++ libc6 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Install Dependencies
COPY package*.json ./
# Force install architecture-specific binaries that Next.js 15 / Tailwind 4 need
RUN npm install --legacy-peer-deps --prefer-offline
RUN npm install @tailwindcss/oxide-linux-x64-gnu lightningcss-linux-x64-gnu --save-optional --legacy-peer-deps

# Step 2: Source Injection
COPY . .

# Step 3: Architecture Bridging (Robust Mapping)
# Next.js 15 looks for these in the parent package directory
RUN mkdir -p node_modules/@tailwindcss/oxide/ node_modules/lightningcss/
RUN find node_modules/@tailwindcss/oxide-linux-x64-gnu -name "*.node" -exec cp {} node_modules/@tailwindcss/oxide/ \; || echo "Oxide bridge failed"
RUN find node_modules/lightningcss-linux-x64-gnu -name "*.node" -exec cp {} node_modules/lightningcss/lightningcss.linux-x64-gnu.node \; || echo "LightningCSS bridge failed"

# Step 4: Diagnostic Verification (Crucial for Debugging)
RUN echo "--- DIAGNOSTIC: Binary Check ---"
RUN ls -la node_modules/lightningcss/ || true
RUN ls -la node_modules/@tailwindcss/oxide/ || true
RUN echo "--- END DIAGNOSTIC ---"

# Step 5: Build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 6: Production Runtime
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

EXPOSE 8080
CMD ["npm", "start"]
