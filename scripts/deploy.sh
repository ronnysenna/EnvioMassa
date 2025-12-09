#!/bin/bash
# Script de deploy automático com versão

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   DEPLOY AUTOMÁTICO - ENVIO MASSA${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Verificar se estamos em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Erro: Não está em um repositório Git${NC}"
  exit 1
fi

# Obter versão usando get-version.sh
APP_VERSION=$(bash scripts/get-version.sh)

# Extrair commit SHA da versão
COMMIT_SHA=$(echo "${APP_VERSION}" | rev | cut -d'-' -f1 | rev)
VERSION=$(echo "${APP_VERSION}" | rev | cut -d'-' -f2- | rev)
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo -e "${YELLOW}📋 Informações do Deploy:${NC}"
echo -e "  Branch: ${BLUE}${BRANCH}${NC}"
echo -e "  Commit: ${BLUE}${COMMIT_SHA}${NC}"
echo -e "  Versão: ${BLUE}${APP_VERSION}${NC}\n"

# Verificar se há mudanças não commitadas
if ! git diff-index --quiet HEAD --; then
  echo -e "${YELLOW}⚠️  Há mudanças não commitadas. Fazendo commit automático...${NC}"
  git add -A
  git commit -m "Auto-deploy: ${APP_VERSION}" || true
fi

# Pull das mudanças mais recentes
echo -e "${YELLOW}📥 Puxando mudanças do repositório...${NC}"
git pull origin ${BRANCH} 2>/dev/null || echo -e "${YELLOW}⚠️  Não conseguiu fazer pull (pode estar offline)${NC}"

# Carregar variáveis de ambiente
if [ -f .env.production ]; then
  echo -e "${YELLOW}📂 Carregando .env.production${NC}"
  export $(cat .env.production | xargs)
else
  echo -e "${YELLOW}⚠️  .env.production não encontrado${NC}"
fi

# Build Docker
echo -e "\n${YELLOW}🔨 Building Docker image...${NC}"
docker build \
  --build-arg NEXT_PUBLIC_APP_VERSION="${APP_VERSION}" \
  --build-arg NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL}" \
  --build-arg NEXT_PUBLIC_CONFIRM_THRESHOLD="${NEXT_PUBLIC_CONFIRM_THRESHOLD:-3}" \
  -t envio-massa:${COMMIT_SHA} \
  -t envio-massa:latest \
  . || { echo -e "${RED}❌ Docker build falhou${NC}"; exit 1; }

echo -e "${GREEN}✅ Docker build bem-sucedido${NC}"

# Deploy com docker-compose
echo -e "\n${YELLOW}🚀 Iniciando deploy com docker-compose...${NC}"

export NEXT_PUBLIC_APP_VERSION="${APP_VERSION}"
export COMMIT_SHA="${COMMIT_SHA}"

docker-compose down 2>/dev/null || true
docker-compose up -d

if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}════════════════════════════════════════${NC}"
  echo -e "${GREEN}✅ DEPLOY REALIZADO COM SUCESSO!${NC}"
  echo -e "${GREEN}════════════════════════════════════════${NC}"
  echo -e "${BLUE}🐳 Imagem: envio-massa:${COMMIT_SHA}${NC}"
  echo -e "${BLUE}📦 Versão: ${APP_VERSION}${NC}"
  echo -e "${BLUE}🔗 URL: ${NEXT_PUBLIC_BASE_URL}${NC}\n"
  
  # Esperar um pouco e verificar se o container está saudável
  sleep 5
  
  if docker ps | grep -q envio-massa; then
    echo -e "${GREEN}✅ Container está rodando${NC}\n"
  else
    echo -e "${RED}❌ Container não está rodando${NC}\n"
    docker-compose logs
    exit 1
  fi
else
  echo -e "\n${RED}❌ Deploy falhou${NC}"
  docker-compose logs
  exit 1
fi
