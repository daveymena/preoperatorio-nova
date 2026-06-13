FROM node:22-slim

# Install chromium and its dependencies (libs explicitly listed since --no-install-recommends skips them)
RUN apt-get update && apt-get install -y \
    chromium \
    tzdata \
    ca-certificates \
    libxss1 libnss3 libnspr4 libatk-bridge2.0-0 libcups2 libdrm2 libgbm1 libasound2 \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Create symlinks for common chromium binary names
RUN ln -sf /usr/bin/chromium /usr/bin/chromium-browser 2>/dev/null; \
    ln -sf /usr/bin/chromium /usr/lib/chromium/chromium 2>/dev/null; \
    echo "Chromium installed at:"; which chromium || echo "NOT FOUND"; \
    ls -la /usr/bin/chromium* 2>/dev/null || echo "No chromium binary found"

# Set Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
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
