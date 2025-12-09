#!/bin/bash
# Script para fazer build do Docker com versão automática

# Obter versão usando get-version.sh
APP_VERSION=$(bash scripts/get-version.sh)

# Extrair commit SHA da versão (último elemento após o -)
COMMIT_SHA=$(echo "${APP_VERSION}" | rev | cut -d'-' -f1 | rev)

echo "🔨 Building Docker image..."
echo "📦 App Version: ${APP_VERSION}"
echo "📝 Commit SHA: ${COMMIT_SHA}"

# Build com a versão
docker build \
  --build-arg NEXT_PUBLIC_APP_VERSION="${APP_VERSION}" \
  --build-arg NEXT_PUBLIC_BASE_URL="${NEXT_PUBLIC_BASE_URL}" \
  --build-arg NEXT_PUBLIC_CONFIRM_THRESHOLD="${NEXT_PUBLIC_CONFIRM_THRESHOLD}" \
  -t envio-massa:${COMMIT_SHA} \
  -t envio-massa:latest \
  .

if [ $? -eq 0 ]; then
  echo "✅ Docker build successful!"
  echo "🐳 Image: envio-massa:${COMMIT_SHA}"
  echo "🐳 Image: envio-massa:latest"
else
  echo "❌ Docker build failed!"
  exit 1
fi
