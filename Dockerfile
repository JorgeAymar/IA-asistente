# ── Stage 1: instalar dependencias ───────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ── Stage 2: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generar cliente Prisma antes del build
RUN npx prisma generate
RUN npm run build

# ── Stage 3: imagen de producción ────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Solo lo necesario para correr
COPY --from=builder /app/public        ./public
COPY --from=builder /app/.next         ./.next
COPY --from=builder /app/node_modules  ./node_modules
COPY --from=builder /app/package.json  ./package.json
COPY --from=builder /app/prisma        ./prisma
COPY --from=builder /app/skills        ./skills
COPY --from=builder /app/skills.json   ./skills.json

EXPOSE 3000

# Migrar la BD y arrancar la app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
