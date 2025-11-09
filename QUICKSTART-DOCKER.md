# 🚀 Guia Rápido - Docker & Coolify

## Comandos Essenciais

### 📋 Pré-Deploy
```bash
# Verificar se está tudo pronto
bun run docker:check
```

### 🧪 Desenvolvimento Local

#### Opção 1: Apenas PostgreSQL (recomendado para dev)
```bash
# Subir apenas o banco
bun run docker:dev

# Rodar app normalmente
bun run dev

# Parar banco
bun run docker:dev:down
```

#### Opção 2: Full Stack (simular produção)
```bash
# Build e teste completo
bun run docker:local

# Ver logs
bun run docker:logs

# Parar tudo
bun run docker:down
```

### 🌐 Deploy Coolify

#### Configurar Serviço
1. Coolify → **+ New** → **Docker Compose**
2. Git repo: `https://github.com/seu-usuario/meu-ponto`
3. Branch: `main`
4. Docker Compose path: `docker-compose.yml`

#### Variáveis Obrigatórias
```bash
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI
DATABASE_URL=postgresql://postgres:SUA_SENHA_FORTE_AQUI@postgres:5432/meu_ponto?schema=public
NODE_ENV=production
APP_PORT=3000
```

**Gerar senha:**
```bash
openssl rand -base64 32
```

#### Deploy
- Clique em **Deploy**
- Aguarde 3-5 min
- Acesse a URL configurada

### ⚙️ Pós-Deploy

#### Criar Admin
```bash
# No terminal do Coolify
docker exec -it meu-ponto-app bun run init:production
```

#### Ver Logs
```bash
docker logs -f meu-ponto-app
```

#### Health Check
```bash
curl https://seu-dominio.com/api/health
```

### 🔄 Atualizações

```bash
# Local
git add .
git commit -m "sua mensagem"
git push origin main

# Coolify faz deploy automático!
```

### 🗄️ Database

#### Backup
```bash
docker exec meu-ponto-db pg_dump -U postgres meu_ponto > backup-$(date +%Y%m%d).sql
```

#### Restore
```bash
cat backup-20251109.sql | docker exec -i meu-ponto-db psql -U postgres meu_ponto
```

#### Migrations
```bash
# Status
docker exec -it meu-ponto-app bunx prisma migrate status

# Deploy migrations
docker exec -it meu-ponto-app bunx prisma migrate deploy

# Studio (visual)
docker exec -it meu-ponto-app bunx prisma studio
```

### 🐛 Troubleshooting

#### App não responde
```bash
# Ver status
docker ps

# Ver logs
docker logs --tail 100 meu-ponto-app

# Restart
docker restart meu-ponto-app
```

#### Database offline
```bash
# Ver logs
docker logs --tail 100 meu-ponto-db

# Verificar saúde
docker exec meu-ponto-db pg_isready -U postgres

# Restart
docker restart meu-ponto-db
```

#### Limpar tudo (CUIDADO: perde dados!)
```bash
docker-compose down -v
docker system prune -a
```

## 📚 Documentação Completa

- **Coolify**: `DEPLOY-COOLIFY.md`
- **Docker**: `docker/README.md`
- **Projeto**: `README.md`

## 🎯 URLs Produção

- **App**: `https://seu-dominio.com/`
- **API**: `https://seu-dominio.com/api/`
- **Health**: `https://seu-dominio.com/api/health`
- **Login**: `https://seu-dominio.com/login`
- **Admin**: `https://seu-dominio.com/admin`

## ✅ Checklist Deploy

- [ ] Executar `bun run docker:check`
- [ ] Criar senha forte para PostgreSQL
- [ ] Configurar variáveis no Coolify
- [ ] Deploy
- [ ] Aguardar health check
- [ ] Criar usuário admin
- [ ] Testar login
- [ ] Configurar backup automático

---

**Pronto para produção!** 🚀
