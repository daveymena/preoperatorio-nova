FROM node:22-slim

# Install dependencies for Chromium (system chromium is not reliable on Debian Bookworm)
RUN apt-get update && apt-get install -y \
    tzdata \
    ca-certificates \
    libnss3 libnspr4 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libasound2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libpango-1.0-0 libcairo2 curl \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Let Puppeteer download its own Chromium (reliable in Docker)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false
ENV NODE_ENV=production
ENV TZ=America/Bogota

WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy the rest
COPY . .

# Build Next.js
RUN npm run build

# Make scripts executable
RUN chmod +x start.sh startup.js

# Create logs directory
RUN mkdir -p /app/logs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start both web server and scheduler
CMD ["./start.sh"]
