ARG NODE_VERSION=22.13.1

FROM node:${NODE_VERSION}-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3500

# Expose the port the app runs on
EXPOSE 3500

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3500/api/health || exit 1

# Start the application
CMD ["npm", "run", "prod"]
