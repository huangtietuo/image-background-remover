FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy backend
COPY backend/ ./backend/
WORKDIR /app/backend

# Install backend dependencies
RUN npm install --production

# Copy frontend and build
WORKDIR /app
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm install && npm run build

# Clean up
RUN rm -rf node_modules

WORKDIR /app

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
