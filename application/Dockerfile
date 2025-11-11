# application/Dockerfile
FROM node:20-alpine

WORKDIR /application

# Copy package files first
COPY package*.json ./
RUN npm install

# Copy everything in the application folder
COPY . .

EXPOSE 3000

CMD ["node", "app.js"]   # app.js is top-level inside ./application
