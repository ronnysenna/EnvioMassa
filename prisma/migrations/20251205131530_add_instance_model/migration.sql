-- CreateTable
CREATE TABLE "Instance" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'n8n-evolution',
    "status" TEXT NOT NULL DEFAULT 'offline',
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhook" TEXT,
    "evolutionUrl" TEXT,
    "evolutionApiKey" TEXT,
    "isHealthy" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Instance_pkey" PRIMARY KEY ("id")
);
