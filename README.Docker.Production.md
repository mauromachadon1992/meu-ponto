# 🐳 Guia de Deploy Docker para Produção - Meu Ponto

## 📋 Pré-requisitos

- Docker 20.10+ e Docker Compose 2.0+
- Domínio configurado (para Coolify/proxy reverso)
- Certificado SSL (Let's Encrypt via Coolify)

## 🚀 Deploy Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas credenciais
nano .env
```

**⚠️ IMPORTANTE**: Gere uma senha forte para produção:
```bash
openssl rand -base64 32
```

### 2. Build e Deploy

```bash
# Build da imagem
docker-compose build

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f app
```

### 3. Executar Migrations e Setup Inicial

```bash
# Aplicar migrations
docker-compose exec app bun run prisma:migrate:deploy

# Criar usuário admin inicial
docker-compose exec app bun run init:production
```

**💡 Dica**: As credenciais do admin serão exibidas no terminal. Anote-as!

### 4. Verificar Aplicação

```bash
# Testar API
curl http://localhost:3000/

# Ou acesse no navegador
open http://localhost:3000
```

## 🔧 Comandos Úteis

### Gerenciamento de Containers

```bash
# Parar containers
docker-compose stop

# Reiniciar containers
docker-compose restart

# Remover containers (mantém dados)
docker-compose down

# Remover tudo (CUIDADO: apaga dados!)
docker-compose down -v
```

### Logs e Debug

```bash
# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f postgres

# Ver últimas 100 linhas
docker-compose logs --tail=100 app

# Acessar shell do container
docker-compose exec app sh
```

### Database Management

```bash
# Executar migrations
docker-compose exec app bun run prisma:migrate:deploy

# Abrir Prisma Studio
docker-compose exec app bun run prisma:studio

# Backup do banco
docker-compose exec postgres pg_dump -U postgres meu_ponto > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose exec -T postgres psql -U postgres meu_ponto < backup.sql
```

## 🌐 Deploy no Coolify

### Opção 1: Docker Compose (Recomendado)

1. **Criar novo Resource no Coolify**
   - Type: Docker Compose
   - Repository: seu repositório Git

2. **Configurar Build**
   - Compose File: `docker-compose.yml`
   - Branch: `master`

3. **Variáveis de Ambiente no Coolify**
   ```
   POSTGRES_PASSWORD=<senha-forte-gerada>
   POSTGRES_DB=meu_ponto
   POSTGRES_USER=postgres
   APP_PORT=3000
   NODE_ENV=production
   ```

4. **Deploy**
   - Coolify irá automaticamente fazer build e deploy
   - Configurar domínio e SSL no painel do Coolify

### Opção 2: Dockerfile Standalone

1. **Criar Application no Coolify**
   - Type: Dockerfile
   - Dockerfile: `Dockerfile.optimized`

2. **Adicionar PostgreSQL Service**
   - Adicionar serviço PostgreSQL 16
   - Conectar à aplicação

3. **Configurar DATABASE_URL**
   ```
   DATABASE_URL=postgresql://user:password@postgres:5432/meu_ponto?schema=public
   ```

4. **Post-deployment Commands**
   ```bash
   bun run prisma:migrate:deploy
   ```

## 🔒 Segurança em Produção

### Checklist de Segurança

- [ ] Senha forte do PostgreSQL (min 16 caracteres)
- [ ] Arquivo `.env` não commitado no Git
- [ ] SSL/TLS configurado (via Coolify)
- [ ] Backup automático do banco configurado
- [ ] Usuário não-root no container (✅ já configurado)
- [ ] Health checks ativos (✅ já configurado)
- [ ] Logs rotacionados
- [ ] Firewall configurado (apenas portas necessárias)

### Variáveis Sensíveis

**NUNCA commite no Git**:
- `.env`
- `credentials-admin.json`
- Backups do banco
- Logs com dados sensíveis

## 📊 Monitoramento

### Health Checks

O container inclui health checks automáticos:
```bash
# Verificar saúde do container
docker inspect --format='{{.State.Health.Status}}' meu-ponto-app
```

### Logs

```bash
# Logs em tempo real com filtro
docker-compose logs -f app | grep ERROR

# Exportar logs
docker-compose logs app > logs_$(date +%Y%m%d).txt
```

### Recursos

```bash
# Ver uso de recursos
docker stats meu-ponto-app

# Ver detalhes do container
docker inspect meu-ponto-app
```

## 🔄 Atualizações

### Atualizar a Aplicação

```bash
# 1. Pull do código atualizado (se usando Git)
git pull origin master

# 2. Rebuild da imagem
docker-compose build --no-cache app

# 3. Recriar container
docker-compose up -d --force-recreate app

# 4. Aplicar migrations (se houver)
docker-compose exec app bun run prisma:migrate:deploy
```

### Zero Downtime Update (Blue-Green)

```bash
# 1. Build nova versão
docker-compose build app

# 2. Escalar para 2 instâncias
docker-compose up -d --scale app=2

# 3. Aguardar nova instância ficar saudável
sleep 30

# 4. Remover instância antiga
docker-compose up -d --scale app=1
```

## 🐛 Troubleshooting

### Aplicação não inicia

```bash
# Verificar logs
docker-compose logs app

# Verificar conexão com banco
docker-compose exec app sh -c "bun -e 'import { PrismaClient } from \"@prisma/client\"; const p = new PrismaClient(); await p.\$connect(); console.log(\"OK\")'"
```

### Erro de Migrations

```bash
# Forçar reset (CUIDADO: apaga dados!)
docker-compose exec app bun run prisma:migrate:reset

# Ou aplicar manualmente
docker-compose exec app bun run prisma:migrate:deploy
```

### Performance Issues

```bash
# Verificar recursos
docker stats

# Aumentar recursos no docker-compose.yml
# Edite seção deploy.resources.limits
```

## 📦 Backup e Restore

### Backup Completo

```bash
#!/bin/bash
# Script de backup completo
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup do banco
docker-compose exec -T postgres pg_dump -U postgres meu_ponto | gzip > "$BACKUP_DIR/database.sql.gz"

# Backup de uploads (se houver)
docker cp meu-ponto-app:/app/uploads "$BACKUP_DIR/uploads"

echo "✅ Backup salvo em $BACKUP_DIR"
```

### Restore

```bash
# Restaurar banco
gunzip < backup/database.sql.gz | docker-compose exec -T postgres psql -U postgres meu_ponto

# Restaurar uploads
docker cp backup/uploads meu-ponto-app:/app/uploads
```

## 🎯 Performance

### Otimizações Aplicadas

- ✅ Multi-stage build (reduz tamanho da imagem)
- ✅ Cache de layers do Docker
- ✅ Usuário não-root
- ✅ Health checks configurados
- ✅ Limites de recursos definidos
- ✅ Alpine Linux (imagem leve)

### Tamanho da Imagem

```bash
# Ver tamanho
docker images | grep meu-ponto

# Esperado: ~200-300MB (otimizado)
```

## 📚 Referências

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Bun Docker Guide](https://bun.sh/guides/ecosystem/docker)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Coolify Documentation](https://coolify.io/docs)

## 💬 Suporte

Para problemas ou dúvidas:
1. Verificar logs: `docker-compose logs -f`
2. Consultar este guia
3. Abrir issue no repositório

---

**Desenvolvido com ❤️ para produção**
