# Script de Inicialização de Produção

Este diretório contém scripts para preparar o sistema **Meu Ponto** para ambiente de produção.

## 📋 Scripts Disponíveis

### `init-production.ts`

Script principal de inicialização que prepara o banco de dados para produção.

**O que o script faz:**

1. ✅ Verifica conexão com o banco de dados
2. 🗑️ **Limpa TODOS os dados** (usuários, registros, períodos)
3. 👤 Cria um usuário Administrador com credenciais geradas automaticamente
4. 💾 Salva as credenciais em `credentials-admin.json`

## 🚀 Como Usar

### Pré-requisitos

1. PostgreSQL instalado e rodando
2. Banco de dados criado
3. Variável `DATABASE_URL` configurada no arquivo `.env`
4. Migrations já aplicadas no banco

### Passo a Passo

#### 1. Aplicar Migrations (se necessário)

```bash
bun run prisma:migrate:deploy
```

#### 2. Executar Script de Inicialização

```bash
bun run init:production
```

ou diretamente:

```bash
bun run scripts/init-production.ts
```

#### 3. Aguardar Confirmação

O script aguarda **5 segundos** antes de executar, permitindo cancelamento com `Ctrl+C`.

#### 4. Anotar Credenciais

Após execução bem-sucedida, você verá:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CREDENCIAIS DO ADMINISTRADOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Nome:     Administrador
   Email:    admin@meuponto.com
   PIN:      1234
   Senha:    Abc123!@#xyz
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

As credenciais também são salvas em `credentials-admin.json`.

#### 5. Fazer Login

Use o **PIN** gerado para fazer login no sistema.

#### 6. Deletar Arquivo de Credenciais

```bash
rm credentials-admin.json
```

⚠️ **IMPORTANTE**: Delete o arquivo após anotar as credenciais em local seguro!

## 🔐 Segurança

### Senha Gerada

- **Tamanho**: 12 caracteres
- **Caracteres**: Letras maiúsculas, minúsculas, números e símbolos
- **Método**: `crypto.randomBytes()` para máxima aleatoriedade
- **Exemplo**: `Kj8#mP2@qL9x`

### PIN Gerado

- **Formato**: 4 dígitos numéricos
- **Faixa**: 1000 a 9999
- **Único**: Garantido no banco de dados
- **Exemplo**: `7342`

## ⚙️ Configuração Pós-Instalação

Após executar o script e fazer login:

1. **Configurações do Sistema**
   - Acesse "Configurações"
   - Configure percentuais de hora extra (40%, 50%, 80%, 100%)
   - Configure adicional noturno (se aplicável)
   - Configure DSR (Descanso Semanal Remunerado)

2. **Criar Usuários**
   - Acesse "Usuários" (menu admin)
   - Adicione funcionários do sistema
   - Defina carga horária e salário de cada um

3. **Períodos de Fechamento**
   - Configure os períodos mensais
   - Defina as datas de fechamento

## 🔄 Workflow Completo de Deploy

### Para Novo Ambiente

```bash
# 1. Clonar repositório
git clone <repo-url>
cd meu-ponto

# 2. Instalar dependências
bun install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com dados corretos

# 4. Criar banco de dados
createdb meu_ponto

# 5. Executar migrations
bun run prisma:migrate:deploy

# 6. Gerar Prisma Client
bun run prisma:generate

# 7. Inicializar produção
bun run init:production

# 8. Anotar credenciais e deletar arquivo
cat credentials-admin.json
rm credentials-admin.json

# 9. Iniciar aplicação
bun run dev
```

### Para Reset do Sistema

⚠️ **CUIDADO**: Isso deleta TODOS os dados!

```bash
bun run init:production
```

## 📝 Notas Importantes

- ⚠️ O script **DELETA TODOS OS DADOS** do banco
- 🔐 As credenciais são geradas **aleatoriamente** a cada execução
- 💾 O arquivo `credentials-admin.json` deve ser **deletado** após uso
- 🎯 Use apenas em ambientes de **desenvolvimento/staging/produção limpa**
- ❌ **NUNCA** execute em produção com dados reais sem backup

## 🐛 Troubleshooting

### Erro de Conexão

```
❌ Erro ao conectar ao banco de dados
```

**Solução**: Verifique se:
- PostgreSQL está rodando: `systemctl status postgresql`
- Variável `DATABASE_URL` está correta no `.env`
- Banco de dados existe: `psql -l | grep meu_ponto`

### Erro de Foreign Key

```
❌ Erro ao limpar banco de dados: Foreign key constraint
```

**Solução**: O script já deleta na ordem correta. Se persistir:
```bash
# Resetar migrations
bun run prisma:migrate:reset --force
bun run init:production
```

### PIN Duplicado

Improvável devido à randomização, mas se ocorrer, execute novamente:
```bash
bun run init:production
```

## 📞 Suporte

Para problemas ou dúvidas, consulte a documentação principal em `DATABASE_SETUP.md`.
