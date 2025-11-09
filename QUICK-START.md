# 🚀 Quick Start - Deploy no Coolify

## ⚡ Deploy em 5 Minutos

> **✅ Atualização**: O servidor agora serve o frontend Angular na raiz (`/`) e a API em `/api/*`

### 1. Preparar Variáveis de Ambiente

```bash
# Gerar senha forte
openssl rand -base64 32
```

### 2. No Coolify

1. **New Resource** → **Docker Compose**
2. **Repository**: `https://github.com/seu-usuario/meu-ponto`
3. **Branch**: `master`
4. **Compose File**: `docker-compose.coolify.yml`

### 3. Adicionar Variáveis

```env
POSTGRES_PASSWORD=<cole-a-senha-gerada-aqui>
```

### 4. Configurar Domínio (Opcional)

Settings → Domains → `meuponto.seudominio.com`

### 5. Deploy

Clique em **Deploy** e aguarde ~3-5 minutos.

### 6. Criar Admin

Via terminal do container no Coolify:

```bash
bun run init:production
```

### ✅ Pronto!

Acesse: `https://meuponto.seudominio.com`

**Nota**: O frontend Angular será servido na raiz (`/`) e a API em `/api/*`

---

## 📚 Documentação Completa

- `DEPLOY-COOLIFY.md` - Guia detalhado do Coolify
- `README.Docker.Production.md` - Guia Docker completo
- `DOCKER-CHECKLIST.md` - Checklist e troubleshooting
- `.github/CICD.md` - Configuração CI/CD

---

## 🆘 Problemas?

### Aplicação não inicia

```bash
# Ver logs no Coolify
Logs → Real-time
```

### Erro de conexão com banco

Verificar variável `POSTGRES_PASSWORD` está configurada.

### Precisa de ajuda?

Consulte `DEPLOY-COOLIFY.md` seção **Troubleshooting**.

---

**Deploy simplificado para produção! 🎉**
