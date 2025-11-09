# Deploy no Coolify - Meu Ponto

Guia de deploy da aplicação fullstack no Coolify com Docker.

## 🏗️ Arquitetura

- **Frontend**: Angular 20 (SPA servido como static files)
- **Backend**: Elysia.js com Bun runtime
- **Database**: PostgreSQL 16
- **Container**: Dockerfile multi-stage otimizado

## 🚀 Deploy Automático no Coolify

### 1. Criar Novo Serviço

1. No Coolify, clique em **+ New** → **Docker Compose**
2. Conecte seu repositório Git
3. Branch: `main`

### 2. Configurar Variáveis de Ambiente

No Coolify, adicione as seguintes variáveis:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SUA_SENHA_SEGURA_AQUI
POSTGRES_DB=meu_ponto
POSTGRES_PORT=5432

# Application
APP_PORT=3000
NODE_ENV=production
TZ=America/Sao_Paulo

# Database URL (construído automaticamente)
DATABASE_URL=postgresql://postgres:SUA_SENHA_SEGURA_AQUI@postgres:5432/meu_ponto?schema=public
```

**⚠️ IMPORTANTE**: Gere uma senha forte para `POSTGRES_PASSWORD`:
```bash
openssl rand -base64 32
```

### 3. Configurar Portas e Domínio

**⚠️ IMPORTANTE**: Configure o subdomínio ANTES do primeiro deploy!

- **Container Port**: 3000
- **Subdomínio**: Ex: `meu-ponto.seu-servidor.com` ou `ponto.exemplo.com`
- **SSL/TLS**: Habilitar Let's Encrypt (automático)
- **Proxy Headers**: O Coolify injeta automaticamente headers necessários

### 4. Volumes Persistentes

O Coolify criará automaticamente:
- `meu-ponto-postgres-data`: Dados do PostgreSQL
- `meu-ponto-app-data`: Dados da aplicação (fotos, etc)

### 5. Deploy

1. **Verifique todas as configurações acima**
2. Clique em **Deploy**
3. Aguarde o build (3-5 minutos na primeira vez)
4. Acompanhe os logs durante o deploy
5. **Teste após deploy**:
   ```bash
   # Health check
   curl https://seu-dominio.com/api/health
   
   # Página inicial
   curl -I https://seu-dominio.com/
   ```

### 6. Pós-Deploy - Primeira Inicialização

**⚠️ OBRIGATÓRIO após primeiro deploy**:

1. Abra o terminal do container `app` no Coolify
2. Execute o script de inicialização:
   ```bash
   bun run init:production
   ```
3. **ANOTE as credenciais exibidas** (nome, email, PIN)
4. Delete o arquivo de credenciais:
   ```bash
   rm /app/data/credentials-admin.json
   ```
5. Teste o login em: `https://seu-dominio.com/login`

## 🔧 Build Local (Teste antes do Deploy)

⚠️ **IMPORTANTE**: Use `docker-compose.local.yml` para testes locais, não `docker-compose.yml`!

```bash
# 1. Criar arquivo .env
cat > .env << EOF
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=meu_ponto
APP_PORT=3000
EOF

# 2. Build da imagem
docker build -t meu-ponto:latest .

# 3. Testar com docker-compose (arquivo local)
docker-compose -f docker-compose.local.yml up -d

# 4. Ver logs
docker-compose -f docker-compose.local.yml logs -f app

# 5. Acessar
open http://localhost:3000

# 6. Parar
docker-compose -f docker-compose.local.yml down
```

### Diferenças: Local vs Coolify

| Aspecto | Local (`docker-compose.local.yml`) | Coolify (`docker-compose.yml`) |
|---------|-----------------------------------|--------------------------------|
| Portas | ✅ Expostas (3000, 5432) | ❌ Não expor (Traefik gerencia) |
| Container names | ✅ Fixos (`-local` suffix) | ❌ Gerenciados pelo Coolify |
| Volume names | ✅ Fixos (`-local` suffix) | ❌ Gerenciados pelo Coolify |
| Senha padrão | ✅ Pode usar `postgres` | ❌ Obrigatória (`:?`) |

## 📊 Monitoramento

### Health Check
```bash
curl http://seu-dominio.com/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2025-11-09T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### Logs no Coolify
- Acesse a aba **Logs** do serviço
- Filtre por `app` ou `postgres`

## 🔐 Segurança

1. **Senha do PostgreSQL**: Use senha forte (min. 32 caracteres)
2. **Backup**: Configure backup automático do volume PostgreSQL
3. **HTTPS**: Configure SSL/TLS no Coolify (automático com Let's Encrypt)
4. **Firewall**: Limite acesso ao PostgreSQL (apenas interno)

## 🗄️ Banco de Dados

### Primeira Inicialização

Ao fazer o primeiro deploy:

1. As migrations serão executadas automaticamente (`prisma migrate deploy`)
2. Execute o script de inicialização para criar usuário admin:

```bash
# No container da aplicação (com confirmação de 5s)
docker exec meu-ponto-app bun run init:production

# OU sem confirmação (recomendado para scripts automatizados)
docker exec meu-ponto-app bun run init:production:force
```

Isso criará:
- Usuário admin com PIN aleatório
- Salva credenciais em `/app/data/credentials-admin.json`

**⚠️ IMPORTANTE**: Anote as credenciais exibidas no console!

Para visualizar as credenciais salvas:
```bash
docker exec meu-ponto-app cat /app/data/credentials-admin.json
```

Para deletar o arquivo após anotar:
```bash
docker exec meu-ponto-app rm /app/data/credentials-admin.json
```

### Migrations Futuras

```bash
# Executar novas migrations
docker exec -it meu-ponto-app bunx prisma migrate deploy

# Ver status das migrations
docker exec -it meu-ponto-app bunx prisma migrate status
```

### Backup e Restore

```bash
# Backup
docker exec meu-ponto-db pg_dump -U postgres meu_ponto > backup.sql

# Restore
cat backup.sql | docker exec -i meu-ponto-db psql -U postgres meu_ponto
```

## 🔄 Atualizações

O Coolify faz deploy automático a cada push no branch configurado:

1. Push para `main`
2. Coolify detecta mudanças
3. Build da nova imagem
4. Zero-downtime deployment
5. Health check valida nova versão

## 🐛 Troubleshooting

### ⚠️ **Subdomínio não abre nada (tela em branco)**

**Sintomas**:
- Subdomínio configurado no Coolify
- Deploy bem-sucedido
- Ao acessar via navegador: página em branco ou erro de conexão

**Causas comuns**:
1. **CORS bloqueando proxy** (✅ CORRIGIDO na versão atual)
2. **Headers de proxy não processados** (✅ CORRIGIDO na versão atual)
3. **Container não escutando em 0.0.0.0** (✅ VERIFICADO)
4. **SSL/TLS não configurado** no Coolify
5. **Healthcheck falhando**

**Diagnóstico**:
```bash
# 1. Verificar se container está rodando
docker ps | grep meu-ponto-app

# 2. Testar health check internamente
docker exec -it meu-ponto-app curl http://localhost:3000/api/health

# 3. Verificar logs do servidor
docker logs meu-ponto-app | grep "Servidor rodando"

# 4. Testar com headers de proxy
curl -H "X-Forwarded-Proto: https" \
     -H "X-Forwarded-Host: seu-dominio.com" \
     http://localhost:3000/api/health

# 5. Verificar se está escutando em todas as interfaces
docker exec -it meu-ponto-app netstat -tulpn | grep 3000
```

**Solução**:
1. **Garantir que SSL/TLS está habilitado** no Coolify
2. **Verificar configuração de proxy** no Coolify:
   - Deve estar em modo "HTTP/HTTPS"
   - Port: 3000
   - SSL: Habilitado
3. **Verificar DNS** do subdomínio:
   ```bash
   nslookup seu-dominio.com
   ```
4. **Forçar rebuild** no Coolify (limpar cache)

### App não inicia
```bash
# Ver logs completos
docker logs meu-ponto-app

# Comum: DATABASE_URL incorreta
# Verificar se postgres:5432 está acessível
docker exec -it meu-ponto-app ping postgres
```

### Erro de conexão com DB
```bash
# Verificar saúde do PostgreSQL
docker ps | grep postgres

# Conectar manualmente
docker exec -it meu-ponto-db psql -U postgres -d meu_ponto

# Verificar DATABASE_URL
docker exec -it meu-ponto-app env | grep DATABASE_URL
```

### Frontend não carrega (404 em assets)
```bash
# Verificar se build foi criado
docker exec -it meu-ponto-app ls -la dist/meu-ponto/browser/

# Deve ter: index.html, main-*.js, styles-*.css, assets/

# Verificar MIME types
curl -I https://seu-dominio.com/main.js
# Deve retornar: Content-Type: application/javascript
```

### Erro "Mixed Content" (HTTP em HTTPS)
**Causa**: Angular está fazendo requests HTTP em página HTTPS.

**Solução**: Verificar se `environment.prod.ts` usa URL relativa:
```typescript
apiUrl: '/api' // ✅ CORRETO (usa protocolo da página)
// NÃO: apiUrl: 'http://...' // ❌ ERRADO
```

### 📋 Guia Completo de Troubleshooting
Consulte: [COOLIFY-TROUBLESHOOTING.md](./COOLIFY-TROUBLESHOOTING.md)

## 📝 Estrutura dos Containers

### Container `app`
```
/app
├── dist/meu-ponto/browser/  # Frontend (Angular build)
├── server/                   # Backend (Elysia.js)
├── node_modules/             # Dependências
├── prisma/                   # Schema + Client
└── data/                     # Dados persistentes (fotos)
```

### Container `postgres`
```
/var/lib/postgresql/data/pgdata  # Dados do PostgreSQL
```

## 🎯 URLs da Aplicação

Após deploy no Coolify:

- **Frontend**: `https://seu-dominio.com/`
- **API**: `https://seu-dominio.com/api/`
- **Health**: `https://seu-dominio.com/api/health`
- **Admin**: `https://seu-dominio.com/admin`
- **Login**: `https://seu-dominio.com/login`

## 📞 Suporte

Em caso de problemas:
1. Verificar logs no Coolify
2. Testar health check endpoint
3. Validar variáveis de ambiente
4. Confirmar conectividade PostgreSQL
