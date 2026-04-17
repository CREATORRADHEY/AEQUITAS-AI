# Full-Environment Hardened Dockerfile
# This version uses the full node:18 image to ensure all build-essential 
# and shared libraries are present for native CSS engine modules.

FROM node:18
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Force isolation and clean start
COPY package*.json ./
RUN rm -rf node_modules && npm cache clean --force

# Step 2: Brute-Force Architecture Install
# We explicitly install the missing linux binary to guarantee it exists
RUN npm install --legacy-peer-deps
RUN npm install lightningcss-linux-x64-gnu --save-optional --legacy-peer-deps

# Step 3: Pre-flight Verification
# This will show in the logs that the binary is finally present
RUN find node_modules/lightningcss -name "*.node"

# Step 4: Source & Build
COPY . .
ARG NODE_OPTIONS
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 5: Production Runtime
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

EXPOSE 8080
CMD ["npm", "start"]
