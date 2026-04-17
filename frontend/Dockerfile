# DIRECT INJECTION Hardened Dockerfile
# This version explicitly forces the installation of Linux native bindings
# to bypass the persistent npm architecture resolution bug.

FROM node:18
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Step 1: Sync and Wipe
COPY . .
RUN rm -rf node_modules package-lock.json

# Step 2: Architecture Injection
# We force-install the exact Linux binaries needed by Tailwind 4 and Next.js 15
RUN npm install --legacy-peer-deps
RUN npm install @tailwindcss/oxide-linux-x64-gnu lightningcss-linux-x64-gnu --save-optional --legacy-peer-deps

# Step 3: Forced Rebuild
# This ensures the .node bindings are correctly registered for the Linux kernel
RUN npm rebuild @tailwindcss/oxide lightningcss

# Step 4: Final Verification
# If these don't show up in the logs, we have a filesystem sync issue in Cloud Build
RUN ls -R node_modules/@tailwindcss/oxide-linux-x64-gnu || echo "Oxide binary STILL missing"
RUN ls -R node_modules/lightningcss-linux-x64-gnu || echo "LightningCSS binary STILL missing"

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
