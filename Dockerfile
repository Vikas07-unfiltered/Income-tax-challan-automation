# Use Node.js 18 with Chrome pre-installed
FROM ghcr.io/puppeteer/puppeteer:21.6.1

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application files
COPY . .

# Create directories for PDFs
RUN mkdir -p Challan_PDFs

# Set proper permissions
RUN chown -R pptruser:pptruser /usr/src/app
USER pptruser

# Expose port (if needed for health checks)
EXPOSE 3000

# Start the application
CMD ["node", "challan_automation.js"]
