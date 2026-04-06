# ── Build stage ───────────────────────────────────────────────
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies first (layer caching)
COPY package*.json ./
RUN npm ci --only=production

# ── Development image ─────────────────────────────────────────
FROM base AS development
RUN npm install --include=dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ── Production image ──────────────────────────────────────────
FROM base AS production
COPY . .
EXPOSE 3000
CMD ["node", "src/server.js"]
