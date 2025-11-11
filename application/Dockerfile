# Use Node 20 Alpine
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose Node app port
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]