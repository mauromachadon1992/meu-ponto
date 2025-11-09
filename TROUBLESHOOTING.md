# 🔍 Troubleshooting Gateway Timeout

## Verificar Logs no Coolify

### 1. Logs do Container App
No Coolify, vá até o serviço e clique em **Logs** → **app**

Procure por:
```
✅ Servidor rodando em: http://...
```

Se não aparecer, verifique erros como:
- ❌ DATABASE_URL não configurada
- ❌ Build do frontend não encontrado
- ENOENT: no such file or directory

### 2. Logs do Container PostgreSQL
No Coolify, vá até **Logs** → **postgres**

Deve mostrar:
```
database system is ready to accept connections
```

### 3. Health Check Status
No terminal local (se tiver acesso SSH ao servidor):

```bash
# Ver status dos containers
docker ps

# Ver logs em tempo real
docker logs -f meu-ponto-app

# Testar health check manualmente
docker exec meu-ponto-app curl http://localhost:3000/api/health
```

## Possíveis Causas do Gateway Timeout

### ❌ Causa 1: DATABASE_URL não configurada
**Solução:** Verificar variáveis de ambiente no Coolify

Deve ter:
```
DATABASE_URL=postgresql://postgres:SENHA@postgres:5432/meu_ponto?schema=public
```

### ❌ Causa 2: Migrations falhando
**Logs mostram:** `prisma migrate deploy` com erro

**Solução:**
```bash
# Conectar ao container
docker exec -it meu-ponto-app sh

# Tentar manualmente
bunx prisma migrate deploy
```

### ❌ Causa 3: Build do frontend não copiado
**Logs mostram:** `Build do frontend não encontrado`

**Solução:** Rebuild da imagem Docker
```bash
# No Coolify: Force Rebuild
```

### ❌ Causa 4: Porta 3000 não exposta
**Verificar no docker-compose.yml:**
```yaml
ports:
  - "3000:3000"  # ou "${APP_PORT:-3000}:3000"
```

### ❌ Causa 5: Coolify timeout muito curto
**Solução:** Aumentar timeout no Coolify

Configuração → Advanced → **Timeout**: 300 (5 minutos)

## Comandos de Debug

### Ver estrutura do container
```bash
docker exec meu-ponto-app ls -la /app
docker exec meu-ponto-app ls -la /app/dist/meu-ponto/browser/
```

### Testar conexão com DB
```bash
docker exec meu-ponto-db psql -U postgres -d meu_ponto -c "SELECT 1;"
```

### Ver variáveis de ambiente
```bash
docker exec meu-ponto-app env | grep -E "DATABASE|NODE_ENV|PORT"
```

### Reiniciar apenas o app (sem rebuild)
```bash
docker restart meu-ponto-app
```

## Checklist Rápido

- [ ] DATABASE_URL configurada corretamente no Coolify
- [ ] Porta 3000 mapeada no docker-compose
- [ ] PostgreSQL saudável (`service_healthy`)
- [ ] Migrations executadas com sucesso
- [ ] Build do frontend existe em `/app/dist/meu-ponto/browser/`
- [ ] Health check respondendo em `/api/health`
- [ ] Logs não mostram erros críticos

## Se Nada Funcionar

1. **Testar localmente primeiro:**
   ```bash
   bun run docker:local
   curl http://localhost:3000/api/health
   ```

2. **Se funcionar local mas não no Coolify:**
   - Verificar se variáveis de ambiente estão corretas
   - Verificar se volumes estão persistindo
   - Verificar se rede Docker está ok

3. **Rebuild completo:**
   ```bash
   # No Coolify
   Force Rebuild (checkbox marcado)
   Deploy
   ```

4. **Ver logs detalhados do entrypoint:**
   Os logs devem mostrar cada etapa:
   - 🚀 Iniciando Meu Ponto...
   - ✅ DATABASE_URL configurada
   - 🔧 Gerando Prisma Client...
   - 📊 Executando migrations...
   - ✅ Build do frontend encontrado
   - 🌐 Iniciando servidor...
