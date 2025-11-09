# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM oven/bun:1.1.42-alpine AS frontend-builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb ./
COPY tsconfig.json tsconfig.app.json angular.json ./
COPY tailwind.config.js components.json ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY src ./src
COPY public ./public
COPY libs ./libs

# Build do Angular para produção
RUN bun run build:prod

# ==========================================
# Stage 2: Setup Backend + Prisma
# ==========================================
FROM oven/bun:1.1.42-alpine AS backend-builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lock ./

# Instalar dependências (incluindo Prisma)
RUN bun install --frozen-lockfile

# Copiar schema Prisma e gerar client
COPY prisma ./prisma
RUN bunx prisma generate

# Copiar código do servidor
COPY server ./server

# ==========================================
# Stage 3: Runtime - Produção
# ==========================================
FROM oven/bun:1.1.42-alpine AS runtime

WORKDIR /app

# Instalar dependências do sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copiar node_modules do backend builder
COPY --from=backend-builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar arquivos necessários
COPY --from=backend-builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=backend-builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=backend-builder --chown=nodejs:nodejs /app/server ./server

# Copiar build do frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Criar diretório para arquivos de produção
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Script de inicialização
CMD ["sh", "-c", "bunx prisma migrate deploy && bun run server:prod"]
