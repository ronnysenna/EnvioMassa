# Sistema de Versão Automática

## 📦 Como Funciona

A versão da aplicação é gerada **automaticamente** a partir de:

1. **Versão base**: Lida do `package.json` (campo `version`)
2. **Commit SHA**: Obtido do git (últimos 7 caracteres do commit atual)

**Formato final**: `{versão}-{commit-sha}`  
**Exemplo**: `1.0.1-54f61ba`

## 🔄 Ciclo Automático

### Em Desenvolvimento (`npm run dev`)
1. Script `scripts/generate-version.js` é executado automaticamente
2. Lê versão do `package.json`
3. Obtém commit SHA do repositório git
4. Atualiza `.env.local` com `NEXT_PUBLIC_APP_VERSION`
5. Inicia o servidor Next.js com a versão configurada

### Em Build de Produção (`npm run build`)
1. Script `scripts/generate-version.js` é executado antes do build
2. Mesmo processo que em desenvolvimento
3. Compila a versão no bundle JavaScript
4. A versão fica imutável até o próximo build

### Em Docker
1. O Dockerfile executa: `node scripts/generate-version.js`
2. Depois executa: `npm run build`
3. A versão é determinada no momento do build docker

### No GitHub Actions
1. Workflow faz checkout completo do repositório
2. Executa: `node scripts/generate-version.js`
3. Executa: `npm run build`
4. Versão é gerada automaticamente baseada no commit do push

## 📝 O que NÃO fazer

❌ **NÃO edite manualmente** `.env.local` para versão  
❌ **NÃO faça commit** do `.env.local` com versão hardcoded  
❌ **NÃO use variáveis de ambiente** para definir versão manualmente

## ✅ Fluxo de Deploy Recomendado

```bash
# 1. Fazer mudanças no código
git add .
git commit -m "Minhas mudanças"

# 2. Atualizar versão no package.json (opcional, se necessário)
npm version patch  # ou minor, major, etc
git push

# 3. GitHub Actions executará automaticamente:
# - Checkout
# - npm ci
# - npx prisma generate
# - node scripts/generate-version.js
# - npm run build
# - Deploy
```

## 🧪 Testando Localmente

```bash
# Ver versão atual
cat .env.local | grep NEXT_PUBLIC_APP_VERSION

# Executar script manualmente
node scripts/generate-version.js

# Iniciar dev com versão automática
npm run dev

# Build com versão automática
npm run build
```

## 📊 Exemplo de Comportamento

### Cenário 1: Desenvolvimento Local
```
Commit: a1b2c3d4e5f6g7h
package.json versão: 1.0.1

Resultado:
NEXT_PUBLIC_APP_VERSION=1.0.1-a1b2c3d
```

### Cenário 2: Push para main
```
Commit: f9e8d7c6b5a4321
package.json versão: 1.0.1

GitHub Actions Resultado:
NEXT_PUBLIC_APP_VERSION=1.0.1-f9e8d7c
```

### Cenário 3: Docker Build
```
Commit: xyz789abc123def
package.json versão: 2.0.0

Docker Resultado:
NEXT_PUBLIC_APP_VERSION=2.0.0-xyz789a
```

## 🔍 Visualizando a Versão

A versão aparece no:
- **Dashboard**: Parte inferior direita, campo "Versão"
- **Console do navegador**: Disponível como `process.env.NEXT_PUBLIC_APP_VERSION`
- **Bundle JS**: Embutida no código compilado

## 🐛 Troubleshooting

### "Versão não está atualizando?"
- Verifique que está em um repositório git: `git rev-parse --short HEAD`
- Limpe o `.next`: `rm -rf .next`
- Execute o script manualmente: `node scripts/generate-version.js`

### "Vejo 1.0.0-dev?"
- Provavelmente não está em um repo git válido
- Verifique: `git status`
- Ou `package.json` não existe

### "Versão diferente em dev vs build?"
- Commits podem ser diferentes entre o momento de dev e build
- Faça commit antes de fazer build: `git add -A && git commit -m "..."`
- Versão será consistente para o mesmo commit

## 📚 Arquivos Relacionados

- `scripts/generate-version.js` - Script que gera versão
- `package.json` - Contém versão base
- `.env.local` - Arquivo gerado (não commithar versão hardcoded)
- `Dockerfile` - Executa script antes do build
- `.github/workflows/version-build.yml` - Workflow de CI/CD
