# Build stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application — output to /app/dist_build so the volume
# mount at /app/dist does NOT shadow the built files
RUN npm run build -- --outDir /app/dist_build

# On every run, actively copy the fresh build into the shared volume
CMD ["sh", "-c", "rm -rf /app/dist/* && cp -r /app/dist_build/. /app/dist/ && echo 'Frontend dist copied to volume successfully'"]
