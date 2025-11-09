# 🐳 Docker Setup - Meu Ponto

## 📋 Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

## 🚀 Quick Start

### Desenvolvimento

```bash
# Build e iniciar em modo dev (com hot reload)
docker-compose -f docker-compose.dev.yml up --build

# Acessar: http://localhost:4200
```

### Produção

```bash
# Build da imagem
docker-compose build

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f meu-ponto-app

# Acessar: http://localhost:80
```

## 🛠️ Comandos Úteis

### Build

```bash
# Build sem cache
docker-compose build --no-cache

# Build apenas do frontend
docker-compose build meu-ponto-app
```

### Container Management

```bash
# Parar containers
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar serviço específico
docker-compose restart meu-ponto-app

# Ver logs em tempo real
docker-compose logs -f

# Executar comando dentro do container
docker-compose exec meu-ponto-app sh
```

### Limpeza

```bash
# Remover imagens não utilizadas
docker image prune -a

# Remover volumes não utilizados
docker volume prune

# Limpeza completa do sistema Docker
docker system prune -a --volumes
```

## 📁 Estrutura de Arquivos

```
meu-ponto/
├── Dockerfile              # Build de produção (multi-stage)
├── Dockerfile.dev          # Build de desenvolvimento
├── docker-compose.yml      # Produção
├── docker-compose.dev.yml  # Desenvolvimento
├── nginx.conf             # Configuração Nginx
├── .dockerignore          # Arquivos ignorados no build
└── .env.example           # Variáveis de ambiente exemplo
```

## 🔧 Configuração

### Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite `.env` com suas configurações:
```env
NODE_ENV=production
POSTGRES_PASSWORD=sua_senha_segura
JWT_SECRET=seu_jwt_secret
```

### Nginx

O arquivo `nginx.conf` inclui:
- ✅ Gzip compression
- ✅ Cache headers otimizados
- ✅ Security headers
- ✅ PWA support
- ✅ Angular routing (SPA)
- ✅ Health check endpoint

### Multi-stage Build

O `Dockerfile` usa 2 stages:
1. **Builder**: Compila a aplicação Angular com Bun
2. **Runtime**: Serve com Nginx Alpine (imagem pequena)

**Benefícios:**
- Imagem final leve (~25MB)
- Build rápido com Bun
- Produção otimizada

## 🌐 Deploy em Produção

### Docker Swarm

```bash
# Inicializar swarm
docker swarm init

# Deploy do stack
docker stack deploy -c docker-compose.yml meu-ponto

# Verificar serviços
docker service ls
```

### Kubernetes

```bash
# Gerar manifests do compose
kompose convert -f docker-compose.yml

# Aplicar no cluster
kubectl apply -f .
```

### Cloud Providers

#### AWS ECS
```bash
# Instalar ECS CLI
ecs-cli compose --project-name meu-ponto service up
```

#### Google Cloud Run
```bash
# Build e push
gcloud builds submit --tag gcr.io/PROJECT-ID/meu-ponto

# Deploy
gcloud run deploy meu-ponto --image gcr.io/PROJECT-ID/meu-ponto
```

#### Azure Container Instances
```bash
# Criar resource group
az group create --name meu-ponto-rg --location eastus

# Deploy
az container create --resource-group meu-ponto-rg \
  --name meu-ponto --image meuponto:latest \
  --ports 80
```

## 🔒 Segurança

### Boas Práticas Implementadas

- ✅ Multi-stage build (reduz superfície de ataque)
- ✅ Non-root user no Nginx
- ✅ Security headers configurados
- ✅ Health checks configurados
- ✅ Secrets via environment variables
- ✅ .dockerignore otimizado

### Melhorias Recomendadas

```bash
# Scan de vulnerabilidades
docker scan meu-ponto-frontend

# Análise com Trivy
trivy image meu-ponto-frontend

# Análise com Snyk
snyk container test meu-ponto-frontend
```

## 📊 Monitoramento

### Health Check

```bash
# Verificar health do container
docker inspect --format='{{.State.Health.Status}}' meu-ponto-frontend

# Endpoint HTTP
curl http://localhost/health
```

### Logs

```bash
# Logs em tempo real
docker-compose logs -f --tail=100

# Logs de erro apenas
docker-compose logs | grep ERROR
```

### Métricas

```bash
# Stats do container
docker stats meu-ponto-frontend

# Uso de recursos
docker-compose top
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs completos
docker-compose logs meu-ponto-app

# Inspecionar container
docker inspect meu-ponto-frontend

# Verificar portas em uso
netstat -tuln | grep 80
```

### Problemas de build

```bash
# Build com verbose
docker-compose build --progress=plain

# Build sem cache
docker-compose build --no-cache
```

### Problemas de rede

```bash
# Listar redes
docker network ls

# Inspecionar rede
docker network inspect meu-ponto-network

# Recriar rede
docker-compose down && docker-compose up -d
```

## 📝 Notas

- **Desenvolvimento**: Use `docker-compose.dev.yml` para hot reload
- **Produção**: Use `docker-compose.yml` para build otimizado
- **Backend**: Descomente as seções de backend/database quando implementar
- **SSL/TLS**: Configure reverse proxy (Traefik/Nginx) para HTTPS

## 🔗 Links Úteis

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
