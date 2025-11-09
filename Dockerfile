# Stage 1: Build da aplicação Angular
FROM oven/bun:1 AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json bun.lockb ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build da aplicação para produção
RUN bun run build

# Stage 2: Servidor Nginx para servir a aplicação
FROM nginx:alpine

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar os arquivos buildados do stage anterior
COPY --from=builder /app/dist/meu-ponto/browser /usr/share/nginx/html

# Copiar arquivos públicos (logos, manifest, etc)
COPY --from=builder /app/public /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]
