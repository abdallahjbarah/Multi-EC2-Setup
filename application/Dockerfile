FROM node:20-alpine

WORKDIR /application

# Copy package files first
COPY package*.json ./
RUN npm install


COPY . .

EXPOSE 3000

CMD ["node", "app.js"]