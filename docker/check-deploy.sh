#!/bin/bash

# Script de Verificação Pré-Deploy
# Valida que tudo está pronto para produção no Coolify

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       Meu Ponto - Verificação Pré-Deploy Coolify          ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "🔍 Verificando arquivos essenciais..."

# 1. Verificar Dockerfile
if [ -f "Dockerfile" ] && [ -s "Dockerfile" ]; then
    check_pass "Dockerfile existe e não está vazio"
else
    check_fail "Dockerfile não encontrado ou vazio"
fi

# 2. Verificar docker-compose.yml
if [ -f "docker-compose.yml" ] && [ -s "docker-compose.yml" ]; then
    check_pass "docker-compose.yml existe e não está vazio"
else
    check_fail "docker-compose.yml não encontrado ou vazio"
fi

# 3. Verificar .dockerignore
if [ -f ".dockerignore" ]; then
    check_pass ".dockerignore existe"
else
    check_warn ".dockerignore não encontrado (recomendado)"
fi

# 4. Verificar package.json
if [ -f "package.json" ]; then
    check_pass "package.json existe"
    
    # Verificar scripts necessários
    if grep -q '"build:prod"' package.json; then
        check_pass "Script build:prod configurado"
    else
        check_fail "Script build:prod não encontrado em package.json"
    fi
    
    if grep -q '"server:prod"' package.json; then
        check_pass "Script server:prod configurado"
    else
        check_fail "Script server:prod não encontrado em package.json"
    fi
else
    check_fail "package.json não encontrado"
fi

# 5. Verificar Prisma
if [ -f "prisma/schema.prisma" ]; then
    check_pass "Schema Prisma existe"
else
    check_fail "prisma/schema.prisma não encontrado"
fi

# 6. Verificar ambiente de produção
if [ -f "src/environments/environment.prod.ts" ]; then
    check_pass "environment.prod.ts existe"
    
    # Verificar se apiUrl está configurado
    if grep -q "apiUrl.*'/api'" src/environments/environment.prod.ts; then
        check_pass "apiUrl configurado para '/api' (correto para produção)"
    else
        check_warn "apiUrl pode não estar configurado corretamente"
    fi
else
    check_fail "src/environments/environment.prod.ts não encontrado"
fi

# 7. Verificar servidor de produção
if [ -f "server/index.production.ts" ]; then
    check_pass "server/index.production.ts existe"
    
    # Verificar se serve arquivos estáticos
    if grep -q "staticPlugin" server/index.production.ts; then
        check_pass "Servidor configurado para servir arquivos estáticos"
    else
        check_warn "staticPlugin pode não estar configurado"
    fi
else
    check_fail "server/index.production.ts não encontrado"
fi

# 8. Verificar arquivos públicos
if [ -d "public" ]; then
    check_pass "Diretório public/ existe"
    
    if [ -f "public/manifest.webmanifest" ]; then
        check_pass "PWA manifest existe"
    else
        check_warn "manifest.webmanifest não encontrado (PWA)"
    fi
else
    check_warn "Diretório public/ não encontrado"
fi

# 9. Verificar .env.example
if [ -f ".env.example" ]; then
    check_pass ".env.example existe"
    
    # Verificar variáveis essenciais
    if grep -q "DATABASE_URL" .env.example; then
        check_pass "DATABASE_URL configurada em .env.example"
    else
        check_warn "DATABASE_URL não encontrada em .env.example"
    fi
else
    check_warn ".env.example não encontrado (recomendado)"
fi

# 10. Verificar angular.json
if [ -f "angular.json" ]; then
    check_pass "angular.json existe"
    
    # Verificar configuração de produção
    if grep -q '"production"' angular.json; then
        check_pass "Configuração de produção existe em angular.json"
    else
        check_fail "Configuração de produção não encontrada"
    fi
else
    check_fail "angular.json não encontrado"
fi

echo ""
echo "🧪 Testando build local (opcional)..."
echo "   Para testar: docker build -t meu-ponto:test ."
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   VERIFICAÇÃO CONCLUÍDA                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Tudo pronto para deploy no Coolify!${NC}"
echo ""
echo "Próximos passos:"
echo "1. Faça commit e push das mudanças"
echo "2. Configure o serviço no Coolify"
echo "3. Adicione as variáveis de ambiente"
echo "4. Inicie o deploy"
echo ""
echo "Documentação: ./DEPLOY-COOLIFY.md"
echo ""
