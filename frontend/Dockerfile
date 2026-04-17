# Final Hardened Dockerfile (NPM Bug Workaround)
# This version explicitly deletes package-lock.json to bypass 
# the npm architecture bug (Issue #4828) mentioned in the logs.

FROM node:18
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Force clean resolution for the target architecture
COPY package*.json ./
# NUCLEAR FIX: Delete package-lock to force npm to fetch Linux native bindings
# instead of trying to use the Mac-restricted bindings from the lockfile.
RUN rm -rf node_modules package-lock.json && npm cache clean --force

# Step 2: Architecture-Specific Install
ENV npm_config_arch=x64
ENV npm_config_platform=linux
RUN npm install --legacy-peer-deps

# Step 3: Source & Build
COPY . .
ARG NODE_OPTIONS
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Step 4: Production Runtime
ENV NODE_ENV production
ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

EXPOSE 8080
CMD ["npm", "start"]
