# ========================================
# Multi-stage Dockerfile para Produção
# Meu Ponto - Time Tracking System
# ========================================

# ========================================
# Stage 1: Build Frontend (Angular 20)
# ========================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb* ./
COPY components.json ./
COPY tsconfig*.json ./
COPY angular.json ./
COPY tailwind.config.js ./
COPY prisma.config.ts ./

# Instalar Bun
RUN npm install -g bun

# Instalar dependências (incluindo dev para build)
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY libs/ ./libs/
COPY prisma/ ./prisma/

# Gerar Prisma Client
RUN bun run prisma:generate

# Build do Angular para produção
RUN bun run build --configuration=production

# ========================================
# Stage 2: Runtime (Bun + Elysia)
# ========================================
FROM oven/bun:1-alpine AS runtime

# Instalar dependências do sistema
RUN apk add --no-cache \
    ca-certificates \
    tzdata \
    curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar arquivos de dependências
COPY --chown=nodejs:nodejs package.json bun.lockb* ./
COPY --chown=nodejs:nodejs components.json ./
COPY --chown=nodejs:nodejs tsconfig*.json ./
COPY --chown=nodejs:nodejs prisma.config.ts ./

# Instalar apenas dependências de produção
RUN bun install --production --frozen-lockfile

# Copiar Prisma schema e migrations
COPY --chown=nodejs:nodejs prisma/ ./prisma/

# Gerar Prisma Client (necessário no runtime)
RUN bun run prisma:generate

# Copiar código do servidor
COPY --chown=nodejs:nodejs server/ ./server/
COPY --chown=nodejs:nodejs scripts/ ./scripts/

# Copiar build do frontend do stage anterior
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist/meu-ponto/browser ./public

# Criar diretório para uploads (se necessário no futuro)
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Configurar timezone para São Paulo
ENV TZ=America/Sao_Paulo

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Usar usuário não-root
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Comando de inicialização
CMD ["bun", "run", "server/index.ts"]
