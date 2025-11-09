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

### 3. Configurar Portas

- **Porta pública**: 3000 (ou configurar proxy reverso do Coolify)
- A aplicação expõe apenas a porta 3000 (frontend + backend juntos)

### 4. Volumes Persistentes

O Coolify criará automaticamente:
- `meu-ponto-postgres-data`: Dados do PostgreSQL
- `meu-ponto-app-data`: Dados da aplicação (fotos, etc)

### 5. Deploy

1. Clique em **Deploy**
2. Aguarde o build (3-5 minutos na primeira vez)
3. A aplicação estará disponível na URL configurada

## 🔧 Build Local (Teste antes do Deploy)

```bash
# 1. Build da imagem
docker build -t meu-ponto:latest .

# 2. Testar com docker-compose
cp .env.example .env
# Edite .env com suas configurações

docker-compose up -d

# 3. Ver logs
docker-compose logs -f app

# 4. Acessar
http://localhost:3000

# 5. Parar
docker-compose down
```

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
# No container da aplicação
docker exec -it meu-ponto-app bun run init:production
```

Isso criará:
- Usuário admin com PIN aleatório
- Salva credenciais em `credentials-admin.json`

**⚠️ IMPORTANTE**: Anote as credenciais e delete o arquivo JSON!

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

### App não inicia
```bash
# Ver logs completos
docker-compose logs app

# Comum: DATABASE_URL incorreta
# Verificar se postgres:5432 está acessível
```

### Erro de conexão com DB
```bash
# Verificar saúde do PostgreSQL
docker-compose ps postgres

# Conectar manualmente
docker exec -it meu-ponto-db psql -U postgres -d meu_ponto
```

### Frontend não carrega
```bash
# Verificar se build foi criado
docker exec -it meu-ponto-app ls -la dist/meu-ponto/browser/

# Deve ter: index.html, main-*.js, styles-*.css
```

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
