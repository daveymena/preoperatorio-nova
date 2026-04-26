FROM node:22-slim

# Install chromium and its dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest
COPY . .

# Build Next.js
RUN npm run build

# Make start script executable
RUN chmod +x start.sh

EXPOSE 3000

# Start both web server and scheduler
CMD ["./start.sh"]
