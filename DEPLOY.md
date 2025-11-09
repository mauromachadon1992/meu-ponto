# 🚀 Guia Rápido de Deploy em Produção

Este guia mostra como preparar o sistema **Meu Ponto** para produção de forma rápida e eficiente.

## ✅ Pré-requisitos

- PostgreSQL instalado e rodando
- Bun instalado (`curl -fsSL https://bun.sh/install | bash`)
- Node.js 18+ (para Angular CLI)

## 📦 Instalação Completa

### 1. Clone e Configure

```bash
# Clonar repositório
git clone <seu-repositorio>
cd meu-ponto

# Instalar dependências
bun install

# Configurar variáveis de ambiente
cp .env.example .env
```

### 2. Edite o `.env`

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/meu_ponto?schema=public"
```

### 3. Prepare o Banco de Dados

```bash
# Criar banco (se não existir)
createdb meu_ponto

# Executar migrations
bun run prisma:migrate:deploy

# Gerar Prisma Client
bun run prisma:generate
```

### 4. Inicializar Sistema

```bash
# Executar script de inicialização
bun run init:production
```

**O script irá:**
- ✅ Verificar conexão com banco
- 🗑️ Limpar todos os dados existentes
- 👤 Criar usuário Admin com PIN e senha gerados
- 💾 Salvar credenciais em `credentials-admin.json`

**Exemplo de saída:**

```
╔═══════════════════════════════════════════════════╗
║   SCRIPT DE INICIALIZAÇÃO DE PRODUÇÃO            ║
║   Sistema: Meu Ponto                              ║
╚═══════════════════════════════════════════════════╝

🔌 Verificando conexão com banco de dados...
✅ Conexão estabelecida com sucesso!

🗑️  Limpando banco de dados...
   ✓ Registros de ponto deletados
   ✓ Períodos de fechamento deletados
   ✓ Usuários deletados
✅ Banco de dados limpo com sucesso!

👤 Criando usuário administrador...

✅ Usuário Admin criado com sucesso!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CREDENCIAIS DO ADMINISTRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Nome:     Administrador
   Email:    admin@meuponto.com
   PIN:      7342
   Senha:    Kj8#mP2@qL9x
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANTE: Guarde estas credenciais em local seguro!
   O PIN será usado para login no sistema.

💾 Credenciais salvas em: credentials-admin.json
```

### 5. Anotar e Proteger Credenciais

```bash
# Visualizar credenciais
cat credentials-admin.json

# IMPORTANTE: Deletar após anotar!
rm credentials-admin.json
```

⚠️ **NUNCA** commite o arquivo `credentials-admin.json`!

### 6. Iniciar Sistema

```bash
# Modo desenvolvimento (Angular + API)
bun run dev

# Ou separadamente:
# Terminal 1: Frontend
bun run start

# Terminal 2: Backend
bun run server:dev
```

## 🎯 Acesso Inicial

1. Abra o navegador: `http://localhost:4200`
2. Faça login com o **PIN** gerado
3. Configure o sistema:
   - Percentuais de hora extra
   - Adicional noturno
   - DSR (Descanso Semanal Remunerado)
   - Regras de registro

## 🔄 Reset do Sistema

Para resetar completamente o sistema (⚠️ **deleta todos os dados**):

```bash
bun run init:production
```

## 📋 Comandos Úteis

```bash
# Desenvolvimento
bun run dev                    # Iniciar frontend + backend
bun run start                  # Iniciar apenas frontend
bun run server:dev             # Iniciar apenas backend

# Prisma
bun run prisma:generate        # Gerar Prisma Client
bun run prisma:migrate:deploy  # Aplicar migrations (produção)
bun run prisma:migrate         # Criar nova migration (dev)
bun run prisma:studio          # Abrir Prisma Studio

# Produção
bun run init:production        # Inicializar sistema limpo
bun run build                  # Build de produção
```

## 🔐 Segurança das Credenciais

### Senha Gerada
- 12 caracteres aleatórios
- Letras maiúsculas, minúsculas, números e símbolos
- Gerada com `crypto.randomBytes()` (seguro para produção)

### PIN Gerado
- 4 dígitos (1000-9999)
- Usado para login no sistema
- Único no banco de dados

## 📚 Documentação Adicional

- **Scripts**: `scripts/README.md` - Detalhes sobre scripts de inicialização
- **Banco de Dados**: `DATABASE_SETUP.md` - Configuração do PostgreSQL
- **Projeto**: `README.md` - Documentação geral do sistema

## 🐛 Problemas Comuns

### Erro: "Cannot connect to database"
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Verificar variável DATABASE_URL no .env
cat .env | grep DATABASE_URL
```

### Erro: "Migrations not applied"
```bash
# Aplicar todas as migrations
bun run prisma:migrate:deploy
```

### Erro: "Module not found"
```bash
# Reinstalar dependências
rm -rf node_modules
bun install
```

## 🎉 Pronto!

Seu sistema **Meu Ponto** está configurado e pronto para produção!

**Próximos passos:**
1. ✅ Configure parâmetros do sistema
2. ✅ Crie usuários/funcionários
3. ✅ Configure períodos de fechamento
4. ✅ Teste o fluxo completo de registro
