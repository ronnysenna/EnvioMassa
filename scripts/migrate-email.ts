import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToEmailAndName() {
  try {
    console.log('🔄 Iniciando migração para email e name...\n');

    // 1. Adicionar colunas (se não existirem)
    console.log('1️⃣ Adicionando colunas email e name...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "email" TEXT,
      ADD COLUMN IF NOT EXISTS "name" TEXT;
    `);
    console.log('✅ Colunas adicionadas\n');

    // 2. Migrar dados existentes
    console.log('2️⃣ Migrando dados: username → email e name...');
    await prisma.$executeRawUnsafe(`
      UPDATE "User" 
      SET "email" = "username", 
          "name" = "username" 
      WHERE "email" IS NULL OR "name" IS NULL;
    `);
    console.log('✅ Dados migrados\n');

    // 3. Tornar campos obrigatórios
    console.log('3️⃣ Tornando campos obrigatórios...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ALTER COLUMN "email" SET NOT NULL,
      ALTER COLUMN "name" SET NOT NULL;
    `);
    console.log('✅ Campos configurados como NOT NULL\n');

    // 4. Criar índice único para email
    console.log('4️⃣ Criando índice único para email...');
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
    `);
    console.log('✅ Índice criado\n');

    // 5. Listar usuários migrados
    console.log('📋 Usuários após migração:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    users.forEach(user => {
      console.log(`   - [${user.id}] ${user.name} (${user.email}) - ${user.role}`);
    });

    console.log('\n✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateToEmailAndName();

