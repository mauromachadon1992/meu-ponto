#!/bin/bash

# Script de deploy para produção com Docker
# Este script realiza o build e deploy completo da aplicação

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 Meu Ponto - Deploy para Produção                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verificar se o .env existe
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado!"
    echo "📋 Copiando .env.example para .env..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e configure as variáveis antes de continuar!"
    echo "   Especialmente: POSTGRES_PASSWORD"
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Limpar containers antigos (opcional)
read -p "Deseja remover volumes antigos? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "🗑️  Removendo volumes..."
    docker-compose down -v
fi

# Build das imagens
echo ""
echo "🔨 Construindo imagens Docker..."
docker-compose build --no-cache

# Iniciar serviços
echo ""
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar banco de dados estar pronto
echo ""
echo "⏳ Aguardando banco de dados ficar pronto..."
sleep 10

# Executar migrations
echo ""
echo "📊 Executando migrations do banco de dados..."
docker-compose exec -T app bun run prisma:migrate:deploy

# Verificar se deseja criar usuário admin
read -p "Deseja inicializar com usuário admin? (s/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "👤 Criando usuário admin..."
    docker-compose exec app bun run init:production
fi

# Verificar status dos containers
echo ""
echo "📊 Status dos containers:"
docker-compose ps

# Logs
echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Logs em tempo real:"
echo "   docker-compose logs -f app"
echo ""
echo "🌐 Acesse a aplicação em:"
echo "   - Com Nginx: http://localhost"
echo "   - Direto no app: http://localhost:3000"
echo ""
echo "🔧 Comandos úteis:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Parar: docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo ""
