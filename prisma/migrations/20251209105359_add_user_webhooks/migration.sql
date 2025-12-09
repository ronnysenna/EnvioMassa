-- AddColumn to User model - Add webhook URLs for customization per user
ALTER TABLE "User" ADD COLUMN "webhookSendMessage" TEXT;
ALTER TABLE "User" ADD COLUMN "webhookCreateInstance" TEXT;
ALTER TABLE "User" ADD COLUMN "webhookVerifyInstance" TEXT;
ALTER TABLE "User" ADD COLUMN "webhookConnectInstance" TEXT;
ALTER TABLE "User" ADD COLUMN "webhookDeleteInstance" TEXT;
