#!/bin/bash
# ========================================
# Script de Validação Pré-Deploy
# Meu Ponto - Verifica se está tudo pronto
# ========================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

errors=0
warnings=0

print_header "Validação Pré-Deploy - Meu Ponto"
echo ""

# ========================================
# 1. Verificar Arquivos Essenciais
# ========================================
print_info "Verificando arquivos essenciais..."

files=(
    "Dockerfile.coolify"
    "docker-compose.coolify.yml"
    "docker-entrypoint.sh"
    "package.json"
    "prisma/schema.prisma"
    "server/index.ts"
    ".dockerignore"
    ".env.example"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file existe"
    else
        print_error "$file não encontrado!"
        ((errors++))
    fi
done

echo ""

# ========================================
# 2. Verificar Permissões de Scripts
# ========================================
print_info "Verificando permissões de scripts..."

scripts=(
    "deploy-coolify.sh"
    "docker-entrypoint.sh"
    "build-production.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            print_success "$script é executável"
        else
            print_warning "$script não é executável. Corrigindo..."
            chmod +x "$script"
            print_success "$script agora é executável"
        fi
    fi
done

echo ""

# ========================================
# 3. Verificar Estrutura de Diretórios
# ========================================
print_info "Verificando estrutura de diretórios..."

dirs=(
    "src/app"
    "server"
    "prisma"
    "libs/ui"
    "public"
    ".github/workflows"
)

for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        print_success "$dir/ existe"
    else
        print_error "$dir/ não encontrado!"
        ((errors++))
    fi
done

echo ""

# ========================================
# 4. Verificar Configurações do Package.json
# ========================================
print_info "Verificando package.json..."

if command -v jq &> /dev/null; then
    # Verificar scripts essenciais
    required_scripts=("build:prod" "server:prod" "prisma:migrate:deploy" "docker:build")
    
    for script in "${required_scripts[@]}"; do
        if jq -e ".scripts.\"$script\"" package.json > /dev/null 2>&1; then
            print_success "Script '$script' existe"
        else
            print_warning "Script '$script' não encontrado no package.json"
            ((warnings++))
        fi
    done
else
    print_warning "jq não instalado. Pulando validação detalhada do package.json"
fi

echo ""

# ========================================
# 5. Validar Dockerfile
# ========================================
print_info "Validando Dockerfile.coolify..."

if grep -q "FROM.*node.*alpine" Dockerfile.coolify && \
   grep -q "FROM.*bun.*alpine" Dockerfile.coolify && \
   grep -q "HEALTHCHECK" Dockerfile.coolify; then
    print_success "Dockerfile.coolify está correto"
else
    print_error "Dockerfile.coolify pode ter problemas"
    ((errors++))
fi

echo ""

# ========================================
# 6. Validar Docker Compose
# ========================================
print_info "Validando docker-compose.coolify.yml..."

if grep -q "version:" docker-compose.coolify.yml && \
   grep -q "postgres:" docker-compose.coolify.yml && \
   grep -q "app:" docker-compose.coolify.yml; then
    print_success "docker-compose.coolify.yml está correto"
else
    print_error "docker-compose.coolify.yml pode ter problemas"
    ((errors++))
fi

echo ""

# ========================================
# 7. Verificar .env.example
# ========================================
print_info "Verificando .env.example..."

required_vars=("POSTGRES_PASSWORD" "POSTGRES_DB" "NODE_ENV")

for var in "${required_vars[@]}"; do
    if grep -q "$var" .env.example; then
        print_success "Variável $var está no .env.example"
    else
        print_warning "Variável $var não está no .env.example"
        ((warnings++))
    fi
done

echo ""

# ========================================
# 8. Verificar .dockerignore
# ========================================
print_info "Verificando .dockerignore..."

dockerignore_patterns=("node_modules" ".env" "dist/" ".git")

for pattern in "${dockerignore_patterns[@]}"; do
    if grep -q "$pattern" .dockerignore; then
        print_success "Pattern '$pattern' está no .dockerignore"
    else
        print_warning "Pattern '$pattern' não está no .dockerignore"
        ((warnings++))
    fi
done

echo ""

# ========================================
# 9. Testar Build Local (Opcional)
# ========================================
if command -v docker &> /dev/null; then
    print_info "Docker encontrado. Quer testar o build? (s/N)"
    read -r response
    
    if [[ "$response" =~ ^[Ss]$ ]]; then
        print_info "Testando build do Docker..."
        if docker build -f Dockerfile.coolify -t meu-ponto:test . > /dev/null 2>&1; then
            print_success "Build do Docker bem-sucedido!"
        else
            print_error "Build do Docker falhou!"
            print_info "Execute manualmente: docker build -f Dockerfile.coolify -t meu-ponto:test ."
            ((errors++))
        fi
    fi
else
    print_warning "Docker não encontrado. Pulando teste de build."
fi

echo ""

# ========================================
# 10. Verificar Git
# ========================================
print_info "Verificando repositório Git..."

if [ -d ".git" ]; then
    print_success "Repositório Git inicializado"
    
    # Verificar se há uncommitted changes
    if git diff-index --quiet HEAD --; then
        print_success "Nenhuma mudança não commitada"
    else
        print_warning "Há mudanças não commitadas. Considere fazer commit antes do deploy."
        ((warnings++))
    fi
    
    # Verificar branch
    current_branch=$(git branch --show-current)
    print_info "Branch atual: $current_branch"
    
    if [ "$current_branch" == "master" ] || [ "$current_branch" == "main" ]; then
        print_success "Na branch principal"
    else
        print_warning "Não está na branch principal (master/main)"
    fi
else
    print_warning "Não é um repositório Git"
fi

echo ""

# ========================================
# Resumo
# ========================================
print_header "Resumo da Validação"
echo ""

if [ $errors -eq 0 ] && [ $warnings -eq 0 ]; then
    print_success "✨ Tudo perfeito! Pronto para deploy! ✨"
    echo ""
    print_info "Próximos passos:"
    echo "  1. Configure variáveis no Coolify (POSTGRES_PASSWORD)"
    echo "  2. Execute: ./deploy-coolify.sh"
    echo "  3. Ou faça push para acionar CI/CD"
    exit 0
elif [ $errors -eq 0 ]; then
    print_success "Nenhum erro crítico encontrado"
    print_warning "Foram encontrados $warnings avisos"
    echo ""
    print_info "Você pode prosseguir com o deploy, mas revise os avisos."
    exit 0
else
    print_error "Foram encontrados $errors erros e $warnings avisos"
    echo ""
    print_info "Corrija os erros antes de fazer deploy."
    exit 1
fi
