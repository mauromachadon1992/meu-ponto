# 🚨 IMPORTANTE - Como Fazer Deploy no Coolify

## ❌ O Problema

O `docker-compose` **NÃO FUNCIONA** no Coolify devido ao container helper não ter o comando `docker-compose` (v1).

## ✅ Solução: Usar Dockerfile Direto

### 1. No Coolify, Criar Aplicação

**Tipo:** Application (Dockerfile)
- **NÃO** use "Docker Compose"
- **USE** "Public Repository" ou conecte GitHub

### 2. Configurações Básicas

```
Repository: https://github.com/mauromachadon1992/meu-ponto
Branch: main
Build Pack: Dockerfile
Dockerfile: Dockerfile.coolify
Port: 80
```

### 3. Variáveis de Ambiente (Apenas Frontend)

```env
NODE_ENV=production
TZ=America/Sao_Paulo
API_URL=https://api.freitascasaeconstrucao.com.br
```

### 4. Deploy

- Clique em **Deploy**
- O Coolify irá:
  1. Clonar o repo
  2. Fazer build com `Dockerfile.coolify`
  3. Criar container único com Nginx
  4. Expor na porta 80

## 📦 Para Adicionar Backend Futuramente

### Opção 1: Separar em 2 Aplicações no Coolify

**App 1 - Frontend:**
- Dockerfile: `Dockerfile.coolify`
- Domain: `meuponto.com`
- Port: 80

**App 2 - Backend:**
- Dockerfile: `backend/Dockerfile`
- Domain: `api.meuponto.com`
- Port: 3000

**App 3 - Database:**
- Type: PostgreSQL
- Use Coolify's built-in PostgreSQL service

### Opção 2: Usar Docker Compose v2 (Plugin)

Se você tem acesso SSH ao servidor Coolify:

```bash
# Instalar docker compose v2 no servidor
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Verificar
docker compose version
```

Depois, você pode usar `docker compose` (sem hífen) nos comandos de build.

## 🎯 Resumo

**Para Deploy Imediato (apenas frontend):**
1. Use **Dockerfile** direto, não Docker Compose
2. Arquivo: `Dockerfile.coolify`
3. Configure variáveis de ambiente no painel
4. Deploy!

**Backend e Database:**
- Crie aplicações separadas no Coolify
- Use serviços nativos do Coolify (PostgreSQL)
- Conecte via network interna

## 📝 Configuração Atual no Coolify

Baseado nos logs, você já tem:
- ✅ Repository conectado
- ✅ Branch: main
- ❌ Usando Docker Compose (precisa mudar)

**Ação necessária:**
1. Delete a aplicação atual
2. Crie nova como "Dockerfile"
3. Aponte para `Dockerfile.coolify`
4. Deploy

---

**Importante:** O docker-compose.yml é útil para desenvolvimento local, mas **não funciona** no Coolify sem docker compose v2 instalado no servidor.
