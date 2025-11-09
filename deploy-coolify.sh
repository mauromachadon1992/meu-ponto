#!/bin/bash
# ========================================
# Script de Deploy para Coolify
# Meu Ponto - Automação de Deploy
# ========================================

set -e

echo "🚀 Iniciando deploy no Coolify..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Erro: package.json não encontrado. Execute este script na raiz do projeto."
    exit 1
fi

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado. Criando a partir do exemplo..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Configure o arquivo .env antes de continuar!"
        exit 1
    else
        print_error "Arquivo .env.example não encontrado!"
        exit 1
    fi
fi

# Verificar variáveis obrigatórias
source .env
if [ -z "$POSTGRES_PASSWORD" ]; then
    print_error "POSTGRES_PASSWORD não definido no .env"
    exit 1
fi

print_message "Variáveis de ambiente validadas"

# Build da imagem
print_message "Construindo imagem Docker..."
docker-compose -f docker-compose.coolify.yml build --no-cache

# Parar containers antigos (se existirem)
print_message "Parando containers antigos..."
docker-compose -f docker-compose.coolify.yml down

# Iniciar novos containers
print_message "Iniciando novos containers..."
docker-compose -f docker-compose.coolify.yml up -d

# Aguardar serviços ficarem saudáveis
print_message "Aguardando serviços ficarem saudáveis..."
sleep 10

# Verificar se o banco está acessível
print_message "Verificando conexão com banco de dados..."
MAX_RETRIES=30
RETRY_COUNT=0
until docker-compose -f docker-compose.coolify.yml exec -T postgres pg_isready -U postgres 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_error "Falha ao conectar no banco de dados"
        docker-compose -f docker-compose.coolify.yml logs postgres
        exit 1
    fi
    echo "Aguardando banco... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

print_message "Banco de dados conectado!"

# Executar migrations
print_message "Executando migrations..."
docker-compose -f docker-compose.coolify.yml exec -T app bun run prisma:migrate:deploy

# Verificar saúde da aplicação
print_message "Verificando saúde da aplicação..."
sleep 5
if curl -f http://localhost:${PORT:-3000}/ > /dev/null 2>&1; then
    print_message "Aplicação está rodando!"
else
    print_error "Aplicação não está respondendo"
    docker-compose -f docker-compose.coolify.yml logs app
    exit 1
fi

# Resumo
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_message "Deploy concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Status dos containers:"
docker-compose -f docker-compose.coolify.yml ps
echo ""
echo "🌐 Aplicação disponível em: http://localhost:${PORT:-3000}"
echo ""
echo "📝 Comandos úteis:"
echo "  - Ver logs: docker-compose -f docker-compose.coolify.yml logs -f"
echo "  - Parar: docker-compose -f docker-compose.coolify.yml down"
echo "  - Reiniciar: docker-compose -f docker-compose.coolify.yml restart"
echo ""
print_warning "Lembre-se de configurar o domínio e SSL no Coolify!"
echo ""
