# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# We will use Nginx on the host machine to serve the built static files
# The docker-compose will map the /app/dist folder to a shared volume
CMD ["echo", "Frontend built successfully. Files are in /app/dist"]
