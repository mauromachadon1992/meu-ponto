# 🔄 CI/CD Pipeline - Guia de Configuração

## 📋 Visão Geral

Pipeline automatizado para deploy no Coolify usando GitHub Actions.

## 🚀 Fluxo de Deploy

```
Push → Test → Build Image → Deploy Coolify → Health Check
```

## ⚙️ Configuração

### 1. GitHub Secrets

Configure os seguintes secrets no GitHub (Settings > Secrets > Actions):

```
COOLIFY_WEBHOOK_URL     # URL do webhook do Coolify
APP_URL                 # URL da aplicação (https://meuponto.seudominio.com)
COOLIFY_HOST            # IP/domínio do servidor Coolify (opcional)
COOLIFY_SSH_USER        # Usuário SSH (opcional)
COOLIFY_SSH_KEY         # Chave SSH privada (opcional)
SLACK_WEBHOOK           # Webhook do Slack para notificações (opcional)
```

### 2. Obter Webhook do Coolify

1. Acesse sua aplicação no Coolify
2. Vá em **Settings** > **Webhooks**
3. Copie a URL do webhook
4. Adicione como secret `COOLIFY_WEBHOOK_URL` no GitHub

### 3. Habilitar GitHub Container Registry

O pipeline usa GHCR (GitHub Container Registry) para armazenar imagens.

1. Vá em **Settings** > **Actions** > **General**
2. Em "Workflow permissions", selecione:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 4. Configurar Coolify para usar GHCR (Opcional)

Se quiser usar as imagens do GHCR:

```yaml
# No Coolify, configurar image source
image: ghcr.io/seu-usuario/meu-ponto:latest
```

## 🔧 Personalização do Pipeline

### Adicionar Testes

Edite `.github/workflows/deploy.yml`:

```yaml
- name: Run tests
  run: |
    bun test
    bun run lint
    bun run type-check
```

### Multi-ambiente

Criar workflows separados:

```yaml
# .github/workflows/deploy-staging.yml
on:
  push:
    branches:
      - develop

# .github/workflows/deploy-production.yml
on:
  push:
    branches:
      - master
```

### Notificações

Adicionar notificações personalizadas:

```yaml
- name: Notify Discord
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "Deploy to Production"
    description: "Build ${{ github.sha }}"
```

## 📊 Monitoramento

### Ver Status do Pipeline

GitHub > Actions > Deploy to Coolify

### Logs do Deploy

```bash
# Via GitHub Actions UI
Actions > Deploy to Coolify > [workflow run]

# Via Coolify
Logs > Real-time
```

## 🐛 Troubleshooting

### Pipeline falha no build

**Erro**: `Docker build failed`

**Solução**:
1. Testar build localmente: `docker build -f Dockerfile.coolify -t test .`
2. Verificar logs no GitHub Actions
3. Verificar `package.json` e dependências

### Webhook não aciona deploy

**Erro**: Coolify não recebe o webhook

**Solução**:
1. Verificar URL do webhook no GitHub Secrets
2. Testar manualmente: `curl -X POST "$COOLIFY_WEBHOOK_URL"`
3. Verificar logs no Coolify

### Health check falha

**Erro**: `Health check failed after deployment`

**Solução**:
1. Verificar se aplicação está rodando: Coolify > Logs
2. Testar endpoint manualmente: `curl https://seu-app.com/api/health`
3. Aumentar timeout no workflow

## 🔒 Segurança

### Proteger Branch Master

Settings > Branches > Branch protection rules:

- ✅ Require pull request reviews
- ✅ Require status checks to pass (CI tests)
- ✅ Require branches to be up to date

### Secrets Management

- **NUNCA** commite secrets no código
- Use GitHub Secrets para valores sensíveis
- Rotacione webhooks e tokens regularmente

## 📚 Referências

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Coolify Webhook](https://coolify.io/docs/knowledge-base/webhooks)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

---

**Pipeline configurado e pronto para produção! 🚀**
