# MANUAL LINKING Hardened Dockerfile
# This version bypasses the npm architecture bug by manually bridging 
# the native binaries into the target library directories.

FROM node:18
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Sync and Wipe
COPY . .
RUN rm -rf node_modules package-lock.json

# Step 2: Architecture Injection
# Force download the Linux-specific packages
RUN npm install --legacy-peer-deps
RUN npm install @tailwindcss/oxide-linux-x64-gnu lightningcss-linux-x64-gnu --save-optional --legacy-peer-deps

# Step 3: MANUAL BRIDGING (The Workaround)
# We physically move the .node files into the main library directories
# because the npm 'optionalDependencies' logic is failing in Cloud Build.
RUN cp node_modules/@tailwindcss/oxide-linux-x64-gnu/*.node node_modules/@tailwindcss/oxide/ || echo "Oxide bridge failed"
RUN cp node_modules/lightningcss-linux-x64-gnu/*.node node_modules/lightningcss/ || echo "LightningCSS bridge failed"

# Step 4: Verification
# This confirms the binaries are now in the PARENT directories where require() expects them
RUN ls node_modules/@tailwindcss/oxide/*.node
RUN ls node_modules/lightningcss/*.node

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
