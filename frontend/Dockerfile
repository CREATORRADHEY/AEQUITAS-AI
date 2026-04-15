# --- Frontend Dockerfile ---
FROM node:18-alpine

WORKDIR /app

# Copy package config and install
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Set environment variable for the backend API
ENV NEXT_PUBLIC_API_URL=http://localhost:8000

# Build the application
RUN npm run build

# Expose port and start
EXPOSE 3000
CMD ["npm", "start"]
