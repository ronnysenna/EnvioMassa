import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { getWebhookUrl } from "@/lib/webhooks";

/**
 * GET /api/instances
 * Retorna todas as instâncias do usuário
 */
export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const instances = await prisma.instance.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ instances });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

/**
 * POST /api/instances
 * Cria uma nova instância para o usuário
 * Body: { instanceName: string }
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const { instanceName } = body;

    if (!instanceName || typeof instanceName !== "string") {
      return NextResponse.json(
        { error: "Nome da instância é obrigatório" },
        { status: 400 }
      );
    }

    if (instanceName.trim().length === 0) {
      return NextResponse.json(
        { error: "Nome da instância não pode estar vazio" },
        { status: 400 }
      );
    }

    // Verificar se já existe instância com esse nome para este usuário
    const existing = await prisma.instance.findUnique({
      where: {
        userId_instanceName: { userId, instanceName: instanceName.trim() },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma instância com esse nome" },
        { status: 409 }
      );
    }

    // Criar nova instância
    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceName: instanceName.trim(),
        status: "disconnected",
      },
    });

    // Chamar webhook para criar a instância no Evolution API
    let webhookSuccess = false;
    try {
      // Buscar webhooks customizados do usuário
      const userWebhooks = {
        webhookSendMessage: user.webhookSendMessage,
        webhookCreateInstance: user.webhookCreateInstance,
        webhookVerifyInstance: user.webhookVerifyInstance,
        webhookConnectInstance: user.webhookConnectInstance,
        webhookDeleteInstance: user.webhookDeleteInstance,
      };

      const criarInstanciaWebhookUrl = getWebhookUrl(
        "CRIAR_INSTANCIA",
        userWebhooks
      );

      const webhookResponse = await fetch(criarInstanciaWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: instance.instanceName,
          userId: userId,
        }),
      });

      if (webhookResponse.ok) {
        webhookSuccess = true;
      }
    } catch {
      // Webhook error - log only in development
    }

    return NextResponse.json(
      {
        instance,
        webhookCalled: webhookSuccess,
        message: webhookSuccess
          ? "Instância criada e fluxo acionado no N8N"
          : "Instância criada, mas houve erro ao acionar o fluxo N8N",
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
