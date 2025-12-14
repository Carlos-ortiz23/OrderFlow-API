# Multi-stage Dockerfile for building and running the TypeScript Node API

# --- Builder ---
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (including dev) and build the project
COPY package*.json ./
RUN npm install --silent

# Copy sources and build
COPY . .
RUN npm run build


# --- Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm install --production --silent && rm -rf /root/.npm

# Copy built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Ensure app directory owned by `node` to avoid permission issues on Cloud Run
RUN chown -R node:node /app
# Use non-root user provided by the image
USER node

# Expose default port (can be overridden with environment variable)
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"]
