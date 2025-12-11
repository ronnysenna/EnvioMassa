#!/bin/bash

# Script executado automaticamente após o deploy
echo "🚀 Executando migração pós-deploy..."

# Gerar Prisma Client
echo "📦 Gerando Prisma Client..."
npx prisma generate

# Aplicar migrações no banco de dados
echo "🔄 Aplicando migrações no banco..."
npx prisma db push --accept-data-loss --skip-generate

# Verificar se deu certo
if [ $? -eq 0 ]; then
    echo "✅ Migração concluída com sucesso!"
else
    echo "❌ Erro ao executar migração!"
    exit 1
fi

echo "🎉 Deploy finalizado!"

