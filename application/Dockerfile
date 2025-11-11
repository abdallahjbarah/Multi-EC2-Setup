# Use Node 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /application

# Copy package files first for caching
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose port used by Node app
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]
