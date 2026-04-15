# --- Frontend Dockerfile ---
FROM node:20-alpine

WORKDIR /app

# Copy dependency configs
COPY package*.json ./

# Install dependencies (ignoring the missing lockfile to generate a fresh x86 one)
RUN npm install

# Copy application code (User's perfect UI)
COPY . .

# Memory boost for Next.js build
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build the application (Standard build)
RUN npm run build

# Clear build memory env var for runtime
ENV NODE_OPTIONS=""

# Set runtime environment
ENV PORT 8080
ENV NODE_ENV production
ENV HOSTNAME "0.0.0.0"
EXPOSE 8080

# Start the application using dynamic port
CMD ["npm", "start", "--", "-p", "8080"]
