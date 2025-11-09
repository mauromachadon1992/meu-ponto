#!/bin/bash
# ========================================
# Script de Build para Produção
# Meu Ponto - Otimizado para Docker
# ========================================

set -e

echo "🚀 Iniciando build de produção..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${GREEN}➜ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Verificar se Bun está instalado
if ! command -v bun &> /dev/null; then
    print_warning "Bun não encontrado. Instalando..."
    npm install -g bun
fi

# Limpar build anterior
print_step "Limpando build anterior..."
rm -rf dist/
rm -rf .angular/cache
rm -rf node_modules/.cache

# Instalar dependências
print_step "Instalando dependências..."
bun install --frozen-lockfile

# Gerar Prisma Client
print_step "Gerando Prisma Client..."
bun run prisma:generate

# Build do Angular
print_step "Build do Angular (produção)..."
bun run build --configuration=production

# Verificar se build foi bem-sucedido
if [ ! -d "dist/meu-ponto/browser" ]; then
    echo "❌ Erro: Build do Angular falhou!"
    exit 1
fi

# Estatísticas do build
print_step "Estatísticas do build:"
du -sh dist/meu-ponto/browser
echo "Arquivos gerados:"
ls -lh dist/meu-ponto/browser | grep -E '\.(js|css|html)$' | wc -l
echo "arquivos"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Build de produção concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Output: dist/meu-ponto/browser/"
echo "🚀 Pronto para deploy!"
echo ""
