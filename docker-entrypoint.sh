#!/bin/sh
# ========================================
# Entrypoint Script para Container
# Meu Ponto - Time Tracking System
# ========================================

set -e

echo "🚀 Iniciando Meu Ponto..."

# Verificar conexão com o banco de dados
echo "🔍 Verificando conexão com banco de dados..."
MAX_RETRIES=30
RETRY_COUNT=0

until bun run -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); await prisma.\$connect(); await prisma.\$disconnect(); console.log('✅ Conectado!');" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ Falha ao conectar no banco de dados após $MAX_RETRIES tentativas"
    exit 1
  fi
  echo "⏳ Aguardando banco de dados... (tentativa $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

# Executar migrations
echo "📦 Executando migrations do Prisma..."
bun run prisma:migrate:deploy

# Opcional: Seed inicial (comentado por segurança)
# echo "🌱 Executando seed..."
# bun run prisma:seed

echo "✅ Inicialização completa!"

# Executar comando passado para o container
exec "$@"
