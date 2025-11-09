# ==========================================
# Stage 1: Build Angular Frontend
# ==========================================
FROM oven/bun:1.3.1-alpine AS frontend-builder

WORKDIR /app

# Copiar apenas arquivos de dependências primeiro (melhor cache)
COPY package.json bun.lock ./

# Instalar dependências (camada cacheável)
RUN bun install --frozen-lockfile

# Copiar arquivos de configuração
COPY tsconfig.json tsconfig.app.json angular.json ./
COPY tailwind.config.js components.json ./

# Copiar código fonte (após dependências para melhor cache)
COPY src ./src
COPY public ./public
COPY libs ./libs

# Build do Angular para produção
RUN bun run build:prod

# ==========================================
# Stage 2: Setup Backend + Prisma
# ==========================================
FROM oven/bun:1.3.1-alpine AS backend-builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lock ./

# Instalar dependências (incluindo Prisma)
RUN bun install --frozen-lockfile

# Copiar schema Prisma e gerar client
COPY prisma ./prisma
RUN bunx prisma generate

# Copiar código do servidor e scripts
COPY server ./server
COPY scripts ./scripts

# ==========================================
# Stage 3: Runtime - Produção
# ==========================================
FROM oven/bun:1.3.1-alpine AS runtime

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
COPY --from=backend-builder --chown=nodejs:nodejs /app/scripts ./scripts

# Copiar build do frontend
COPY --from=frontend-builder --chown=nodejs:nodejs /app/dist ./dist

# Copiar entrypoint
COPY --chown=nodejs:nodejs docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Criar diretório para arquivos de produção
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check otimizado para Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD bun run -e "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Labels para Coolify (informativas)
LABEL org.opencontainers.image.title="Meu Ponto"
LABEL org.opencontainers.image.description="Sistema de Ponto Eletrônico - Angular + Elysia.js + Prisma"
LABEL org.opencontainers.image.version="1.0.0"

# Entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]
