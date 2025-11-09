# Coolify Deploy - Troubleshooting

## 🔍 Problemas Identificados e Corrigidos

### **Problema 1: CORS bloqueando proxy reverso** ✅ CORRIGIDO
**Sintoma**: Ao acessar via subdomínio do Coolify, a página não carrega ou retorna erro CORS.

**Causa**: O servidor estava com CORS desabilitado em produção (`origin: false`), bloqueando requests vindos do proxy reverso do Coolify.

**Solução aplicada**:
```typescript
cors({
  origin: true, // Permite todas as origens (proxy do Coolify)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
})
```

### **Problema 2: Headers de proxy não tratados** ✅ CORRIGIDO
**Sintoma**: O servidor não reconhece que está sendo acessado via proxy HTTPS.

**Causa**: Faltava middleware para processar headers `X-Forwarded-Proto` e `X-Forwarded-Host` do proxy.

**Solução aplicada**:
```typescript
.onRequest(({ request }) => {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  
  if (isProduction && forwardedProto && forwardedHost) {
    console.log(`🔄 Proxy request: ${forwardedProto}://${forwardedHost}${new URL(request.url).pathname}`);
  }
})
```

### **Problema 3: Porta não configurada corretamente** ✅ VERIFICADO
**Status**: Já estava correto, mas adicionamos `reusePort: true` para melhor performance.

```typescript
.listen({
  port: PORT,
  hostname: '0.0.0.0', // Essencial para Docker/Coolify
  reusePort: true,
})
```

## 🧪 Como Testar Localmente

### 1. Build da imagem Docker
```bash
docker build -t meu-ponto:test .
```

### 2. Testar com proxy simulado
```bash
docker run -d \
  --name meu-ponto-test \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/meu_ponto?schema=public" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  meu-ponto:test
```

### 3. Verificar logs
```bash
docker logs -f meu-ponto-test
```

Você deve ver:
```
🚀 Iniciando Meu Ponto...
✅ DATABASE_URL configurada
🔧 Gerando Prisma Client...
📊 Executando migrations...
✅ Build do frontend encontrado
🌐 Iniciando servidor...
╔═══════════════════════════════════════════════════════════════╗
║  🦊 Meu Ponto - Sistema de Ponto Eletrônico                  ║
║  ✅ Servidor rodando em: http://0.0.0.0:3000                 ║
╚═══════════════════════════════════════════════════════════════╝
```

### 4. Testar endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Frontend (deve retornar HTML)
curl http://localhost:3000/

# Simular proxy (com headers X-Forwarded-*)
curl -H "X-Forwarded-Proto: https" \
     -H "X-Forwarded-Host: meu-ponto.coolify.io" \
     http://localhost:3000/api/health
```

### 5. Limpar
```bash
docker stop meu-ponto-test
docker rm meu-ponto-test
```

## 📋 Checklist de Deploy no Coolify

### Antes do Deploy
- [ ] Variáveis de ambiente configuradas no Coolify
  - [ ] `DATABASE_URL` com senha forte
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `TZ=America/Sao_Paulo`
- [ ] Volumes persistentes criados
  - [ ] `meu-ponto-postgres-data`
  - [ ] `meu-ponto-app-data`
- [ ] Subdomínio configurado no Coolify
- [ ] SSL/TLS habilitado (Let's Encrypt)

### Durante o Deploy
- [ ] Verificar logs de build (3-5 minutos)
- [ ] Aguardar mensagem de sucesso

### Após o Deploy
- [ ] Testar health check: `https://seu-dominio.com/api/health`
- [ ] Verificar se página inicial carrega: `https://seu-dominio.com/`
- [ ] Executar init script (primeira vez):
  ```bash
  # No painel do Coolify, abrir terminal do container 'app'
  bun run init:production
  ```
- [ ] Anotar credenciais do admin
- [ ] Deletar arquivo de credenciais:
  ```bash
  rm /app/data/credentials-admin.json
  ```
- [ ] Testar login no sistema

## 🚨 Problemas Comuns

### "Cannot connect to database"
**Causa**: DATABASE_URL incorreta ou PostgreSQL não iniciado.

**Solução**:
1. Verificar variável `DATABASE_URL` no Coolify
2. Verificar se serviço `postgres` está rodando
3. Verificar logs do PostgreSQL: `docker logs meu-ponto-db`

### "404 Not Found" na raiz
**Causa**: Build do frontend não copiado corretamente.

**Solução**:
1. Verificar logs de build do Dockerfile
2. Confirmar que `dist/meu-ponto/browser/` existe no container:
   ```bash
   docker exec -it <container-app> ls -la dist/meu-ponto/browser/
   ```

### "Mixed Content" errors (HTTP/HTTPS)
**Causa**: Angular tentando fazer requests HTTP em página HTTPS.

**Solução**: O Coolify deve injetar automaticamente os headers corretos. Verificar:
```bash
curl -I https://seu-dominio.com/
```
Deve conter `X-Forwarded-Proto: https`

### Container reinicia continuamente
**Causa**: Healthcheck falhando.

**Solução**:
1. Verificar logs: `docker logs <container-app>`
2. Testar healthcheck manualmente:
   ```bash
   docker exec -it <container-app> \
     bun run -e "fetch('http://localhost:3000/api/health').then(r => console.log(r.status))"
   ```

## 🔧 Configurações do Coolify

### Porta Exposta
- **Container Port**: 3000
- **Public Port**: Automático (80/443 via proxy)

### Proxy Headers (automático no Coolify)
O Coolify injeta automaticamente:
- `X-Forwarded-Proto: https`
- `X-Forwarded-Host: seu-dominio.com`
- `X-Forwarded-For: <client-ip>`
- `X-Real-IP: <client-ip>`

### Healthcheck
- **Endpoint**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s
- **Start Period**: 60s (tempo para iniciar)
- **Retries**: 3

## 📞 Suporte

Se o problema persistir:

1. **Coletar logs**:
   ```bash
   docker logs meu-ponto-app > app.log 2>&1
   docker logs meu-ponto-db > db.log 2>&1
   ```

2. **Verificar conectividade interna**:
   ```bash
   docker exec -it meu-ponto-app ping postgres
   ```

3. **Testar banco de dados**:
   ```bash
   docker exec -it meu-ponto-app \
     bunx prisma db pull --schema=./prisma/schema.prisma
   ```

4. **Verificar variáveis de ambiente**:
   ```bash
   docker exec -it meu-ponto-app env | grep -E "DATABASE_URL|NODE_ENV|PORT"
   ```
