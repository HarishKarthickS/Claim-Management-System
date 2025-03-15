FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm i

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the ports that the app will run on
EXPOSE 3000
# Add any additional ports needed for the socket server

# Create a start script for production that combines Next.js and socket server
RUN echo '#!/bin/sh\nnpm run start & npm run socket' > /app/start-prod.sh && chmod +x /app/start-prod.sh

# Start command for production
CMD ["/app/start-prod.sh"] 