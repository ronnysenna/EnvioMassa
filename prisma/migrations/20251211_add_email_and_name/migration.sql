-- AlterTable: Adicionar campos email e name
-- 1. Adicionar campo email (temporariamente nullable)
ALTER TABLE "User" ADD COLUMN "email" TEXT;

-- 2. Adicionar campo name (temporariamente nullable)
ALTER TABLE "User" ADD COLUMN "name" TEXT;

-- 3. Migrar dados: username → email e name
UPDATE "User" SET "email" = "username", "name" = "username";

-- 4. Tornar campos obrigatórios
ALTER TABLE "User" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "name" SET NOT NULL;

-- 5. Criar índice único para email
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- 6. Remover índice único de username
DROP INDEX IF EXISTS "User_username_key";

-- 7. Remover coluna username (opcional - pode manter por compatibilidade)
-- ALTER TABLE "User" DROP COLUMN "username";

