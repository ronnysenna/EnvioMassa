#!/bin/bash

echo "🔄 Migrando banco de dados em produção..."
echo ""
echo "⚠️  ATENÇÃO: Este script irá:"
echo "   1. Renomear coluna 'name' para 'nome'"
echo "   2. Remover coluna 'username'"
echo "   3. Sincronizar schema do Prisma"
echo ""
read -p "Deseja continuar? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    echo "Operação cancelada."
    exit 1
fi

# Carregar variáveis de ambiente
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Executar migração do schema
echo "📝 Aplicando migração do schema..."
npx prisma db push --accept-data-loss

echo ""
echo "✅ Migração concluída!"
echo ""
echo "🔍 Verificando estrutura do banco..."
npx prisma db pull --print

echo ""
echo "✨ Processo finalizado!"

