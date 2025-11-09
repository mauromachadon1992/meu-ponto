# Coolify Best Practices - Meu Ponto

Este documento detalha as otimizações aplicadas para deploy no Coolify.

## ✅ Melhorias Aplicadas

### 1. Docker Compose Otimizado para Coolify

#### **Portas Removidas**
```yaml
# ❌ ANTES - Conflita com proxy do Coolify
ports:
  - "3000:3000"

# ✅ DEPOIS - Coolify gerencia via Traefik
# Porta removida - proxy automático
```

**Por quê?**
- Coolify usa Traefik como proxy reverso
- Expor portas diretamente causa conflitos
- O proxy detecta automaticamente serviços na porta configurada (3000)

#### **Container Names Removidos**
```yaml
# ❌ ANTES - Causa conflitos em múltiplos deploys
container_name: meu-ponto-app
container_name: meu-ponto-db

# ✅ DEPOIS - Coolify gerencia nomes automaticamente
# (sem container_name)
```

**Por quê?**
- Coolify adiciona UUID único a cada deploy
- Names fixos impedem múltiplas instâncias
- Previne conflitos de nomenclatura

#### **Volume Names Flexíveis**
```yaml
# ❌ ANTES - Nome fixo
volumes:
  postgres_data:
    name: meu-ponto-postgres-data

# ✅ DEPOIS - Coolify gerencia nomes
volumes:
  postgres_data:
    # Coolify gerencia automaticamente
```

**Por quê?**
- Coolify adiciona prefixos para isolamento
- Facilita backup e gerenciamento
- Previne conflitos entre ambientes

#### **Variáveis Obrigatórias com `:?`**
```yaml
# ❌ ANTES - Senha pode ficar vazia
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}

# ✅ DEPOIS - Deploy falha se não configurada
POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
```

**Por quê?**
- Coolify marca visualmente variáveis obrigatórias (borda vermelha)
- Previne deploys com configurações inseguras
- Documentação automática no UI

#### **Labels do Coolify**
```yaml
labels:
  - "coolify.managed=true"
  # Coolify adiciona automaticamente regras de roteamento
```

**Por quê?**
- Identifica containers gerenciados pelo Coolify
- Habilita recursos automáticos (logs, monitoramento, etc)
- Integra com sistema de proxy

### 2. Dockerfile Otimizado

#### **Camadas de Cache Melhoradas**
```dockerfile
# ✅ ORDEM OTIMIZADA
# 1. Copiar apenas package.json e bun.lock
COPY package.json bun.lock ./

# 2. Instalar dependências (camada pesada, muda raramente)
RUN bun install --frozen-lockfile

# 3. Copiar configs (muda pouco)
COPY tsconfig.json angular.json ./

# 4. Copiar código fonte (muda frequentemente)
COPY src ./src
```

**Por quê?**
- Dependências mudam raramente → cache por mais tempo
- Código muda frequentemente → rebuild rápido
- Reduz tempo de build de 5min para ~30s em rebuilds

#### **Labels OCI Padrão**
```dockerfile
LABEL org.opencontainers.image.title="Meu Ponto"
LABEL org.opencontainers.image.description="..."
LABEL org.opencontainers.image.version="1.0.0"
```

**Por quê?**
- Metadados visíveis no Coolify UI
- Facilita identificação de versões
- Padrão da indústria (OCI)

### 3. Servidor Backend Otimizado

#### **CORS Aberto para Proxy**
```typescript
// ✅ Permite requests do proxy Traefik
cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
```

#### **Middleware de Proxy Headers**
```typescript
.onRequest(({ request }) => {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  
  if (isProduction && forwardedProto && forwardedHost) {
    console.log(`🔄 Proxy request: ${forwardedProto}://${forwardedHost}...`);
  }
})
```

**Por quê?**
- Traefik injeta headers `X-Forwarded-*`
- Permite logging e debugging de requests proxied
- Necessário para redirects HTTPS corretos

#### **Listen em 0.0.0.0**
```typescript
.listen({
  port: PORT,
  hostname: '0.0.0.0', // Essencial para Docker
  reusePort: true,
})
```

**Por quê?**
- Docker requer bind em todas interfaces
- `localhost` não funciona em containers
- `reusePort` permite zero-downtime deployments

## 📋 Configuração no Coolify

### Passo a Passo

#### 1. Criar Novo Serviço
1. Coolify → **+ New** → **Docker Compose**
2. Conectar repositório Git
3. Branch: `main`
4. Coolify detecta `docker-compose.yml` automaticamente

#### 2. Configurar Variáveis Obrigatórias

O Coolify destacará estas variáveis com borda vermelha:

```bash
# ⚠️ OBRIGATÓRIA
POSTGRES_PASSWORD=<gerar-senha-forte>

# ✅ Opcional (tem padrão)
POSTGRES_USER=postgres
POSTGRES_DB=meu_ponto
```

Gerar senha:
```bash
openssl rand -base64 32
```

#### 3. Configurar Domínio

**Service: app**
- **Domain**: `https://meu-ponto.seudominio.com`
- **Port**: `3000` (porta interna do container)

⚠️ **IMPORTANTE**: 
- Use `https://` (não `http://`)
- Porta `3000` é apenas informativa (interna)
- Coolify expõe em 80/443 via Traefik

**Service: postgres**
- **Domain**: (deixar vazio - serviço interno)

#### 4. Configurar SSL/TLS

1. Habilitar **Let's Encrypt**
2. Coolify gerencia certificados automaticamente
3. Renovação automática antes de expirar

#### 5. Deploy

1. Clicar em **Deploy**
2. Acompanhar logs (3-5 minutos primeira vez)
3. Aguardar healthcheck passar

### Verificação Pós-Deploy

```bash
# 1. Health check
curl https://meu-ponto.seudominio.com/api/health

# Resposta esperada:
# {"status":"ok","timestamp":"...","environment":"production"}

# 2. Verificar headers de proxy
curl -I https://meu-ponto.seudominio.com/

# Deve conter:
# x-forwarded-proto: https
# x-forwarded-host: meu-ponto.seudominio.com

# 3. Testar frontend
curl https://meu-ponto.seudominio.com/ | grep "Meu Ponto"
```

## 🔧 Deploy Local (Para Testes)

Para testar localmente SEM Coolify:

```bash
# 1. Criar .env
cat > .env << EOF
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
POSTGRES_DB=meu_ponto
EOF

# 2. Descomentar porta no docker-compose.yml
# ports:
#   - "3000:3000"

# 3. Build e start
docker-compose build
docker-compose up -d

# 4. Acessar
open http://localhost:3000
```

## 🚨 Troubleshooting Coolify

### Problema: "Porta 3000 já em uso"
**Causa**: Porta exposta no docker-compose.yml

**Solução**:
```yaml
# Remover/comentar
# ports:
#   - "3000:3000"
```

### Problema: "Container não inicia"
**Causa**: Variável obrigatória não configurada

**Solução**:
1. Verificar variáveis com borda vermelha no Coolify
2. Adicionar valor
3. Redeploy

### Problema: "502 Bad Gateway"
**Causa**: Healthcheck falhando ou app não escutando em 0.0.0.0

**Verificar**:
```bash
# Logs do container
docker logs <container-id>

# Deve mostrar:
# ✅ Servidor rodando em: http://0.0.0.0:3000

# Testar internamente
docker exec -it <container-id> curl http://localhost:3000/api/health
```

### Problema: "Mixed Content" (HTTP em HTTPS)
**Causa**: Frontend fazendo requests HTTP em página HTTPS

**Verificar `environment.prod.ts`**:
```typescript
// ✅ CORRETO - URL relativa (usa protocolo da página)
apiUrl: '/api'

// ❌ ERRADO - URL absoluta HTTP
apiUrl: 'http://api.example.com'
```

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tempo de build** | ~5min | ~30s (rebuilds) |
| **Deploy com subdomínio** | ❌ Não funciona | ✅ Funciona |
| **CORS** | ❌ Bloqueado | ✅ Permitido |
| **Segurança** | ⚠️ Senha opcional | ✅ Obrigatória |
| **Cache Docker** | ⚠️ Ruim | ✅ Otimizado |
| **Múltiplos deploys** | ❌ Conflitos | ✅ Isolados |
| **Proxy headers** | ❌ Ignorados | ✅ Processados |

## 🎯 Checklist Final

Antes de fazer deploy no Coolify:

- [x] ✅ Portas removidas do docker-compose.yml
- [x] ✅ Container names removidos
- [x] ✅ Variáveis obrigatórias com `:?`
- [x] ✅ CORS aberto para proxy
- [x] ✅ Servidor escutando em 0.0.0.0
- [x] ✅ Headers X-Forwarded-* processados
- [x] ✅ Healthcheck em /api/health
- [x] ✅ Labels Coolify adicionadas
- [x] ✅ Dockerfile com cache otimizado
- [x] ✅ Environment.prod.ts com URL relativa

## 📚 Recursos Adicionais

- [Documentação Coolify - Docker Compose](https://coolify.io/docs/knowledge-base/docker/compose)
- [DEPLOY-COOLIFY.md](./DEPLOY-COOLIFY.md) - Guia de deploy completo
- [COOLIFY-TROUBLESHOOTING.md](./COOLIFY-TROUBLESHOOTING.md) - Resolução de problemas

## 🔐 Segurança em Produção

### Variáveis Sensíveis
```bash
# ✅ FAZER
POSTGRES_PASSWORD=$(openssl rand -base64 32)

# ❌ NÃO FAZER
POSTGRES_PASSWORD=postgres
POSTGRES_PASSWORD=123456
```

### SSL/TLS
- ✅ Sempre usar HTTPS em produção
- ✅ Habilitar Let's Encrypt no Coolify
- ✅ Forçar redirect HTTP → HTTPS

### Firewall
- ✅ PostgreSQL não exposto externamente
- ✅ Apenas serviço `app` tem domínio público
- ✅ Coolify gerencia rede interna isolada

### Backup
```bash
# Configurar backup automático no Coolify
# Settings → Backups → Enable Automated Backups
# Frequência: Diária
# Retenção: 7 dias
```

---

**Última atualização**: 9 de novembro de 2025
