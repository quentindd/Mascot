# Dockerfile pour Railway (à la racine)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Using npm install temporarily until package-lock.json is updated
RUN npm install && npm cache clean --force

# Copy rest of backend
COPY backend/ ./

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
