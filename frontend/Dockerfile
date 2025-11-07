# Multi-stage build for React frontend

# Stage 1: Build
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Nginx server
# Note: We'll use a separate nginx container, so this just prepares the build
FROM scratch as export
COPY --from=build /app/dist /dist
