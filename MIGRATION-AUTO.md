# 🚀 Migração Automática de Banco de Dados

## ✅ Configuração Implementada

Este projeto agora executa migrações de banco de dados **automaticamente** durante o deploy!

## 📦 Como Funciona

### 1. **Durante o Build** (`npm run build`)
- Gera o Prisma Client
- Compila a aplicação Next.js
- Após o build, executa `postbuild` que aplica as migrações

### 2. **No Docker/Container** 
- O script `docker-entrypoint.sh` é executado antes de iniciar
- Aplica migrações automaticamente: `prisma db push --accept-data-loss`
- Inicia o servidor Next.js

### 3. **Scripts Disponíveis**

```bash
# Build com migração automática
npm run build

# Deploy completo (gerar + migrar + build + start)
npm run deploy

# Aplicar apenas migrações em produção
npm run migrate:prod

# Script manual de pós-deploy
./scripts/post-deploy.sh
```

## 🔄 Fluxo de Deploy

```
1. Git Push
   ↓
2. Build da Aplicação
   ↓
3. Gerar Prisma Client
   ↓
4. Aplicar Migrações (AUTOMÁTICO)
   ↓
5. Reiniciar Container
   ↓
6. Aplicar Migrações de Novo (AUTOMÁTICO via entrypoint)
   ↓
7. Iniciar Servidor
```

## ⚙️ Configuração no Easypanel

Para garantir que funcione corretamente:

1. **Build Command:**
   ```bash
   npm run build
   ```

2. **Start Command:**
   ```bash
   npm run start
   ```

3. **Variáveis de Ambiente:**
   - `DATABASE_URL` deve estar configurada
   - `NODE_ENV=production`

## 🔧 Problemas Comuns

### Migração não está rodando?

**Verifique:**
1. `DATABASE_URL` está definida?
2. Container tem acesso ao banco de dados?
3. Logs do container mostram a migração?

**Ver logs:**
```bash
# Docker
docker logs nome-do-container

# Easypanel
Ver na aba "Logs" do serviço
```

### Forçar migração manual:

```bash
# Via terminal do container/servidor
npx prisma db push --accept-data-loss
```

## 📝 Arquivos Importantes

- `package.json` - Scripts de build e migração
- `Dockerfile` - Container com entrypoint
- `scripts/docker-entrypoint.sh` - Script de inicialização
- `scripts/post-deploy.sh` - Script de pós-deploy
- `prisma/schema.prisma` - Schema do banco

## ✨ Próximos Deploys

Agora basta fazer:

```bash
git add .
git commit -m "sua mensagem"
git push
```

As migrações rodarão **automaticamente**! 🎉

## 🆘 Suporte

Se a migração falhar:
1. Verifique os logs do container
2. Confirme que `DATABASE_URL` está correta
3. Execute manualmente: `npm run migrate:prod`

