# 🚀 Deploy no Coolify - Guia Completo

## 📋 Pré-requisitos

- Servidor Coolify configurado
- Repositório Git (GitHub/GitLab)
- PostgreSQL 16+ (pode ser provisionado pelo Coolify)
- Domínio configurado (opcional, mas recomendado)

## 🎯 Métodos de Deploy

### Método 1: Docker Compose (Recomendado) ⭐

Este método provisiona automaticamente o PostgreSQL junto com a aplicação.

#### 1. Criar Novo Resource no Coolify

1. Acesse seu painel do Coolify
2. Clique em **"+ New Resource"**
3. Selecione **"Docker Compose"**

#### 2. Configurar Repository

- **Repository URL**: `https://github.com/seu-usuario/meu-ponto.git`
- **Branch**: `master`
- **Docker Compose File**: `docker-compose.coolify.yml`
- **Build Pack**: Docker Compose

#### 3. Configurar Variáveis de Ambiente

No painel do Coolify, adicione as seguintes variáveis:

```env
# Database (Obrigatório)
POSTGRES_PASSWORD=<gere-senha-forte-aqui>

# Opcionais (já têm valores padrão)
POSTGRES_DB=meu_ponto
POSTGRES_USER=postgres
PORT=3000
NODE_ENV=production
```

**Gerar senha forte**:
```bash
openssl rand -base64 32
```

#### 4. Configurar Domínio (Opcional)

1. Vá em **Settings** > **Domains**
2. Adicione seu domínio: `meuponto.seudominio.com`
3. Coolify configurará automaticamente:
   - Proxy reverso (Traefik/Caddy)
   - Certificado SSL (Let's Encrypt)
   - HTTPS redirect

#### 5. Deploy

1. Clique em **"Deploy"**
2. Coolify irá:
   - Clone do repositório
   - Build das imagens
   - Iniciar containers
   - Executar migrations (via entrypoint)
   - Configurar SSL

#### 6. Pós-Deploy

```bash
# Criar usuário admin inicial
# Via terminal do container no Coolify:
bun run init:production

# Ou via Coolify CLI (se disponível):
coolify ssh <app-name> "bun run init:production"
```

---

### Método 2: Dockerfile Standalone + PostgreSQL Service

#### 1. Criar Application

1. **New Resource** > **Application**
2. **Source**: Public/Private Repository
3. **Build Pack**: Dockerfile
4. **Dockerfile**: `Dockerfile.coolify`

#### 2. Adicionar PostgreSQL Service

1. No menu lateral, **Services** > **+ New Service**
2. Selecione **PostgreSQL 16**
3. Configure:
   - Name: `meu-ponto-db`
   - Database: `meu_ponto`
   - User: `postgres`
   - Password: `<senha-forte>`

#### 3. Conectar Application ao Database

Na aplicação, adicione a variável de ambiente:

```env
DATABASE_URL=postgresql://postgres:<password>@meu-ponto-db:5432/meu_ponto?schema=public
```

**Substitua**:
- `<password>`: senha do PostgreSQL
- `meu-ponto-db`: nome do serviço (pode variar no Coolify)

#### 4. Configurar Post-Deployment Commands

No Coolify, em **Settings** > **Commands** > **Post-deployment**:

```bash
bun run prisma:migrate:deploy
```

#### 5. Deploy

Clique em **Deploy** e aguarde.

---

## 🔧 Configurações Avançadas

### Health Checks

O Dockerfile já inclui health checks. No Coolify:

- **Health Check Path**: `/`
- **Health Check Port**: `3000`
- **Start Period**: `40s`
- **Interval**: `30s`

### Resource Limits

Configure em **Settings** > **Resources**:

```yaml
CPU: 1 core
Memory: 1GB (limite), 512MB (reservado)
```

### Persistent Storage

Para o volume de uploads (se necessário):

1. **Settings** > **Storages**
2. Add Storage:
   - **Name**: `uploads`
   - **Mount Path**: `/app/uploads`
   - **Size**: `5GB`

### Environment Variables

Variáveis recomendadas:

```env
# Obrigatórias
DATABASE_URL=postgresql://...
POSTGRES_PASSWORD=<senha>

# Opcionais
NODE_ENV=production
PORT=3000
TZ=America/Sao_Paulo

# Futuros (se implementar)
JWT_SECRET=<secret>
UPLOAD_MAX_SIZE=10485760
```

---

## 🔄 Workflows de Deploy

### Deploy Automático (CI/CD)

Configure no Coolify:

1. **Settings** > **General** > **Automatic Deployment**
2. Ative **Deploy on Push**
3. Configure Webhook no GitHub:
   - Payload URL: `<coolify-webhook-url>`
   - Content type: `application/json`
   - Events: `push` (branch master)

### Deploy Manual

1. Via painel do Coolify: botão **"Deploy"**
2. Via CLI (se disponível):
   ```bash
   coolify deploy <app-name>
   ```

### Rollback

1. **Deployments** > Histórico
2. Selecione versão anterior
3. Clique em **"Redeploy"**

---

## 📊 Monitoramento

### Logs

**Via Coolify UI**:
- **Logs** > Real-time logs
- Filtre por container: `app`, `postgres`

**Via Docker**:
```bash
# SSH no servidor
ssh user@seu-servidor

# Ver logs
docker logs -f <container-id>
```

### Métricas

Coolify fornece métricas básicas:
- CPU usage
- Memory usage
- Network I/O
- Disk usage

### Alertas

Configure em **Settings** > **Notifications**:
- Email
- Slack
- Discord
- Telegram

---

## 🐛 Troubleshooting

### Aplicação não inicia

**1. Verificar logs**:
```
Coolify UI > Logs > Real-time
```

**2. Variáveis de ambiente**:
Verifique se `DATABASE_URL` e `POSTGRES_PASSWORD` estão corretas.

**3. Conexão com banco**:
```bash
# Via terminal do container
docker exec -it <app-container> sh
bun -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); await p.\$connect(); console.log('OK')"
```

### Erro de Migrations

**Sintoma**: `P1001: Can't reach database server`

**Solução**:
1. Verificar se PostgreSQL está rodando
2. Verificar `DATABASE_URL`
3. Executar manualmente:
   ```bash
   docker exec -it <app-container> bun run prisma:migrate:deploy
   ```

### Porta já em uso

**Sintoma**: `Error: Port 3000 already in use`

**Solução**:
- Altere a variável `PORT` no Coolify
- Ou libere a porta 3000 no servidor

### Build falha

**Sintoma**: `Build failed` durante o deploy

**Soluções**:
1. **Cache inválido**: Force rebuild sem cache
2. **Dependências**: Verifique `package.json` e `bun.lockb`
3. **Dockerfile**: Teste localmente:
   ```bash
   docker build -f Dockerfile.coolify -t meu-ponto:test .
   ```

### Performance Ruim

**Soluções**:
1. Aumentar recursos (CPU/Memory)
2. Verificar queries lentas (Prisma logging)
3. Adicionar índices no banco
4. Implementar cache (Redis)

---

## 🔒 Segurança

### Checklist de Produção

- [ ] Senha forte do PostgreSQL (min 32 caracteres)
- [ ] SSL/TLS ativado (Let's Encrypt)
- [ ] Variáveis sensíveis não commitadas
- [ ] Firewall configurado (apenas portas 80/443/22)
- [ ] Backups automáticos configurados
- [ ] Logs de acesso habilitados
- [ ] Rate limiting (via Coolify/Caddy)
- [ ] CORS configurado corretamente
- [ ] Headers de segurança (CSP, HSTS)

### Backup Automático

Configure no Coolify:
1. **Settings** > **Backups**
2. **PostgreSQL Backups**:
   - Schedule: `0 2 * * *` (2h da manhã)
   - Retention: 30 dias
   - Destination: S3/Local

---

## 📚 Scripts Úteis

### Script de Deploy Local para Coolify

```bash
#!/bin/bash
# deploy.sh

chmod +x deploy-coolify.sh
./deploy-coolify.sh
```

### Script de Backup Manual

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/$DATE"
mkdir -p "$BACKUP_DIR"

# Backup do banco via Coolify
coolify backup postgres meu-ponto-db -o "$BACKUP_DIR/database.sql.gz"

echo "✅ Backup salvo em $BACKUP_DIR"
```

### Script de Health Check

```bash
#!/bin/bash
# health-check.sh

URL="https://meuponto.seudominio.com"

if curl -f -s "$URL/" > /dev/null; then
    echo "✅ App is healthy"
    exit 0
else
    echo "❌ App is down"
    exit 1
fi
```

---

## 🎯 Próximos Passos

Após o deploy:

1. **Configurar DNS**: Apontar domínio para IP do Coolify
2. **Testar SSL**: `https://meuponto.seudominio.com`
3. **Criar usuário admin**: `bun run init:production`
4. **Configurar backups**: Schedule automático
5. **Monitorar logs**: Primeiras 24h
6. **Teste de carga**: Verificar performance
7. **Documentar credenciais**: Em local seguro (1Password/Bitwarden)

---

## 💡 Dicas

### Performance

- Use CDN para assets estáticos (Cloudflare)
- Implemente cache (Redis) se necessário
- Configure compressão gzip/brotli (já ativado no Caddy)
- Otimize imagens do frontend

### Custos

- Monitore uso de recursos no Coolify
- Configure auto-scaling se disponível
- Use volume storage com economia

### Manutenção

- Atualize dependências regularmente
- Teste updates em staging antes de produção
- Mantenha backups testados e acessíveis
- Documente mudanças no CHANGELOG.md

---

## 📞 Suporte

- **Documentação Coolify**: https://coolify.io/docs
- **Issues do Projeto**: GitHub Issues
- **Community**: Discord do Coolify

---

**Deploy confiável em produção! 🚀**
