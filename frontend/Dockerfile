# High-Reliability Unified Dockerfile for Aequitas
# This version avoids binary mismatch by forcing a clean Linux-native install
# and skipping complex multi-stage layer copies for core dependencies.

FROM node:18-slim
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Force isolation
# Root .gcloudignore now prevents Mac node_modules from being uploaded, 
# but we add an extra cleanup here just in case.
COPY package*.json ./
RUN rm -rf node_modules

# Step 2: Architecture-Safe Install
# Set flags to ensure the Linux x64 binaries are fetched for lightningcss/sharp
ENV npm_config_arch=x64
ENV npm_config_platform=linux
RUN npm install --legacy-peer-deps

# Step 3: Source & Build
COPY . .
ARG NODE_OPTIONS
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 4: Production Runtime Environment
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

# Note: Using standard 'npm start' or node entrypoint for maximum reliability
# in this unified single-stage container.
EXPOSE 8080
CMD ["npm", "start"]
