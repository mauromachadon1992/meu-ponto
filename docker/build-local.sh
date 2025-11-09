#!/bin/bash

# Script de Build e Teste Local
# Simula o ambiente de produção do Coolify

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Meu Ponto - Build Local de Produção               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Verificar .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env não encontrado. Copiando de .env.example...${NC}"
    cp .env.example .env
    echo "⚠️  EDITE o arquivo .env com suas configurações!"
    exit 1
fi

# 2. Build da imagem Docker
echo -e "${BLUE}📦 Buildando imagem Docker...${NC}"
docker build -t meu-ponto:local .

if [ $? -ne 0 ]; then
    echo "❌ Erro no build da imagem"
    exit 1
fi

echo -e "${GREEN}✓ Imagem criada com sucesso!${NC}"
echo ""

# 3. Subir containers
echo -e "${BLUE}🚀 Iniciando containers...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar containers"
    exit 1
fi

echo -e "${GREEN}✓ Containers iniciados!${NC}"
echo ""

# 4. Aguardar banco de dados
echo "⏳ Aguardando PostgreSQL..."
sleep 5

# 5. Verificar saúde
echo "🏥 Verificando health check..."
for i in {1..10}; do
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Aplicação respondendo!${NC}"
        break
    fi
    echo "   Tentativa $i/10..."
    sleep 3
done

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BUILD CONCLUÍDO                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 Aplicação rodando em: http://localhost:3000"
echo ""
echo "Comandos úteis:"
echo "  docker-compose logs -f app      # Ver logs da aplicação"
echo "  docker-compose logs -f postgres # Ver logs do PostgreSQL"
echo "  docker-compose ps               # Status dos containers"
echo "  docker-compose down             # Parar tudo"
echo "  docker-compose down -v          # Parar e limpar volumes"
echo ""
echo "Inicializar admin:"
echo "  docker exec -it meu-ponto-app bun run init:production"
echo ""
