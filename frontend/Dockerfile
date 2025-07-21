FROM node:20-alpine

# Install additional packages needed for esbuild
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package*.json ./

# Clear npm cache and use npm install instead of npm ci for better compatibility
RUN npm cache clean --force
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the application in development mode
CMD ["npm", "run", "dev"] 