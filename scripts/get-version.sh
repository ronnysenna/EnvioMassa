#!/bin/bash
# Script para obter a versão automática (package.json + git commit SHA)

# Obter commit SHA curto
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

# Obter versão do package.json
VERSION=$(grep '"version"' package.json | head -1 | awk -F'"' '{print $4}')

# Versão final
APP_VERSION="${VERSION}-${COMMIT_SHA}"

# Retornar a versão
echo "${APP_VERSION}"
