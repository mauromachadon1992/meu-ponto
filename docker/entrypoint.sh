#!/bin/sh
set -e

echo "🚀 Iniciando Meu Ponto..."
echo "📍 Working directory: $(pwd)"
echo "📁 Arquivos disponíveis:"
ls -la

echo ""
echo "🗄️  Verificando DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não configurada!"
    exit 1
fi
echo "✅ DATABASE_URL configurada"

echo ""
echo "🔧 Gerando Prisma Client..."
bunx prisma generate

echo ""
echo "📊 Executando migrations..."
bunx prisma migrate deploy

echo ""
echo "📁 Verificando build do frontend..."
if [ -d "dist/meu-ponto/browser" ]; then
    echo "✅ Build do frontend encontrado"
    ls -la dist/meu-ponto/browser/ | head -10
else
    echo "❌ Build do frontend não encontrado!"
    exit 1
fi

echo ""
echo "🌐 Iniciando servidor..."
exec bun run server:prod
