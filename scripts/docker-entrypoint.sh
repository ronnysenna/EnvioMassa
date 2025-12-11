#!/bin/bash
set -e

echo "🚀 Iniciando aplicação..."

# Verificar se DATABASE_URL está definida
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL não está definida!"
    echo "⚠️  Pulando migração do banco de dados..."
else
    echo "🔄 Aplicando migrações do banco de dados..."
    npx prisma db push --accept-data-loss --skip-generate || {
        echo "⚠️  Aviso: Migração falhou, mas continuando..."
    }
    echo "✅ Migrações aplicadas!"
fi

echo "🎯 Iniciando servidor Next.js..."
exec "$@"

