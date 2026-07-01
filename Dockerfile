# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-slim AS builder
WORKDIR /app

# Install all deps (incl. dev) for the build
COPY package.json package-lock.json ./
RUN npm ci

# Build client (vite -> dist/public) and server bundle (esbuild -> dist/index.js)
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Only production deps at runtime (server is bundled with --packages=external)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Built artifacts
COPY --from=builder /app/dist ./dist

# Fly maps external 443/80 -> internal 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/index.js"]
