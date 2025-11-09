# 🚀 Deploy no Coolify - Meu Ponto

Guia completo para deploy da aplicação Meu Ponto no Coolify.

## 📋 Pré-requisitos

- Conta no Coolify (self-hosted ou cloud)
- Repositório Git (GitHub, GitLab, Bitbucket)
- Domínio configurado (opcional)

## 🎯 Arquivos Coolify

```
meu-ponto/
├── Dockerfile.coolify              # Build de produção
├── Dockerfile.coolify.dev          # Build de desenvolvimento
├── docker-compose.coolify.yml      # Produção
├── docker-compose.coolify.dev.yml  # Desenvolvimento
└── README.Coolify.md              # Este arquivo
```

## 🔧 Setup no Coolify

### 1. Criar Novo Projeto

1. Acesse seu Coolify
2. Clique em **"+ New Resource"**
3. Selecione **"Application"**
4. Escolha **"Public Repository"** ou conecte seu GitHub
5. Selecione o repositório `meu-ponto`
6. Build Pack: **Dockerfile**

### 2. Configurar Repositório

**Git Repository:**
```
https://github.com/seu-usuario/meu-ponto.git
```

**Branch:**
- Produção: `main` ou `master`
- Desenvolvimento: `dev` ou `staging`

### 3. Configurar Build

#### Produção

**Build Pack:**
```
Dockerfile
```

**Dockerfile Path:**
```
Dockerfile.coolify
```

**Build Settings:**
- Port: `80`
- Comando de start será automático (ENTRYPOINT no Dockerfile)

**Environment Variables:**
```env
NODE_ENV=production
TZ=America/Sao_Paulo
API_URL=https://api.freitascasaeconstrucao.com.br
```

#### Desenvolvimento

**Build Pack:**
```
Dockerfile
```

**Dockerfile Path:**
```
Dockerfile.coolify.dev
```

**Build Settings:**
- Port: `4200`
- Comando de start será automático

**Environment Variables:**
```env
NODE_ENV=development
TZ=America/Sao_Paulo
API_URL=http://localhost:3000
```

### 4. Configurar Domínio

#### Produção
```
meuponto.example.com
```

#### Desenvolvimento
```
dev.meuponto.example.com
```

**SSL/TLS:**
- ✅ Ativar SSL automático (Let's Encrypt)
- ✅ Force HTTPS redirect

### 5. Configurar Health Check

Coolify detectará automaticamente o health check do Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health
```

**Health Check Endpoint:**
```
GET /health
```

Retorna: `200 OK` com body `"healthy\n"`

## 🚀 Deploy

### Deploy Automático (Recomendado)

1. **Ativar Webhook no Coolify:**
   - Vá em Settings → Webhooks
   - Copie a URL do webhook

2. **Configurar no GitHub:**
   - Settings → Webhooks → Add webhook
   - Payload URL: Cole a URL do Coolify
   - Content type: `application/json`
   - Eventos: `push`, `pull_request`

3. **Push para deploy:**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

Coolify irá automaticamente:
- ✅ Detectar o push
- ✅ Fazer pull do código
- ✅ Executar build
- ✅ Fazer deploy
- ✅ Executar health checks

### Deploy Manual

No painel do Coolify:
1. Clique em **"Deploy"**
2. Aguarde o build e deploy
3. Verifique os logs

## 📊 Monitoramento

### Logs em Tempo Real

No Coolify:
- Clique na aplicação
- Vá em **"Logs"**
- Veja logs em tempo real

### Métricas

Coolify mostra automaticamente:
- 📈 CPU Usage
- 💾 Memory Usage
- 🌐 Network Traffic
- 🔄 Request Count

### Alertas

Configure alertas no Coolify:
1. Settings → Notifications
2. Adicionar Discord, Slack, Email, etc.
3. Escolher eventos:
   - Deploy failed
   - Container stopped
   - High resource usage

## 🔄 Rollback

### Via Interface

1. Vá em **"Deployments"**
2. Encontre o deployment anterior
3. Clique em **"Redeploy"**

### Via Git

```bash
# Reverter último commit
git revert HEAD
git push origin main

# Ou resetar para commit específico
git reset --hard <commit-hash>
git push origin main --force
```

## 🌍 Múltiplos Ambientes

### Estrutura Recomendada

```
Production:
├── Branch: main
├── Domain: meuponto.com
├── Compose: docker-compose.coolify.yml
└── ENV: production

Staging:
├── Branch: staging
├── Domain: staging.meuponto.com
├── Compose: docker-compose.coolify.yml
└── ENV: production

Development:
├── Branch: dev
├── Domain: dev.meuponto.com
├── Compose: docker-compose.coolify.dev.yml
└── ENV: development
```

### Workflow Git

```bash
# Feature branch
git checkout -b feature/nova-funcionalidade
git push origin feature/nova-funcionalidade

# Merge para dev (auto-deploy)
git checkout dev
git merge feature/nova-funcionalidade
git push origin dev

# Após testes, merge para staging
git checkout staging
git merge dev
git push origin staging

# Após aprovação, merge para main (produção)
git checkout main
git merge staging
git push origin main
```

## 🔒 Variáveis de Ambiente

### Configurar no Coolify

1. Vá em **"Environment Variables"**
2. Adicione variáveis necessárias:

```env
# Aplicação
NODE_ENV=production
TZ=America/Sao_Paulo
PORT=80

# Backend (quando implementar)
DATABASE_URL=postgresql://user:pass@postgres:5432/db
JWT_SECRET=seu_jwt_secret_super_seguro
API_URL=https://api.meuponto.com

# Serviços externos
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@meuponto.com
SMTP_PASSWORD=senha_app

# Face Recognition API
FACE_API_KEY=sua_api_key
FACE_API_URL=https://api.face-recognition.com
```

### Secrets

Para informações sensíveis:
1. Use o recurso de **"Secrets"** do Coolify
2. Nunca commite secrets no Git
3. Use `.env.example` como template

## 🔧 Troubleshooting

### Build Falha

**Verificar logs:**
```bash
# No Coolify, vá em Logs → Build Logs
```

**Problemas comuns:**
- ❌ Dependências não instaladas → Verificar `package.json`
- ❌ Erro de build → Verificar `bun run build`
- ❌ Porta em uso → Verificar `PORT` env var

### Container não inicia

**Verificar:**
1. Health check está passando?
2. Porta está disponível?
3. Environment variables corretas?

**Logs do container:**
```bash
# No Coolify: Logs → Runtime Logs
```

### Deploy lento

**Otimizações:**
1. Usar cache de layers Docker
2. Minimizar arquivos copiados (`.dockerignore`)
3. Usar multi-stage build (já implementado)

### SSL/HTTPS não funciona

**Verificar:**
1. Domínio está apontando corretamente?
2. Porta 443 está aberta?
3. Coolify pode acessar Let's Encrypt?

**Forçar renovação SSL:**
- Settings → SSL → Renew Certificate

## 📈 Performance

### Otimizações Implementadas

- ✅ Multi-stage build (imagem ~25MB)
- ✅ Nginx com Gzip compression
- ✅ Cache headers otimizados
- ✅ Static assets com cache de 1 ano
- ✅ Minimal base image (Alpine)

### Monitoramento de Performance

No Coolify:
- CPU Usage → Deve ficar < 50%
- Memory Usage → Deve ficar < 80%
- Response Time → Deve ficar < 500ms

### Escala Horizontal (Futuro)

Quando necessário, adicionar no compose:

```yaml
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 10s
```

## 🔐 Segurança

### Checklist

- ✅ HTTPS ativado
- ✅ Security headers configurados
- ✅ Secrets não commitados
- ✅ Container non-root
- ✅ Health checks ativos
- ✅ Logs habilitados

### Backups

Coolify faz backup automático de:
- Configurações
- Environment variables
- Volumes (se houver)

**Agendar backups:**
Settings → Backups → Schedule

## 📞 Suporte

### Recursos

- [Coolify Docs](https://coolify.io/docs)
- [Coolify Discord](https://discord.gg/coolify)
- [GitHub Issues](https://github.com/coollabsio/coolify/issues)

### Comandos Úteis

```bash
# Acessar container via SSH
ssh user@coolify-server
docker exec -it meu-ponto-app sh

# Ver logs
docker logs -f meu-ponto-app

# Reiniciar aplicação
docker restart meu-ponto-app
```

## ✅ Checklist de Deploy

Antes de fazer deploy em produção:

- [ ] Testar build localmente
- [ ] Verificar environment variables
- [ ] Configurar domínio e SSL
- [ ] Ativar health checks
- [ ] Configurar alertas
- [ ] Testar rollback
- [ ] Documentar processo
- [ ] Fazer backup das configurações

## 🎉 Próximos Passos

Após deploy bem-sucedido:

1. **Monitoramento:** Configure Sentry/LogRocket
2. **Analytics:** Adicione Google Analytics/Plausible
3. **CDN:** Configure Cloudflare
4. **Backup:** Configure backups automáticos
5. **CI/CD:** Melhore pipeline com testes

---

**Coolify Version:** 4.0+
**Última atualização:** 9 de novembro de 2025
