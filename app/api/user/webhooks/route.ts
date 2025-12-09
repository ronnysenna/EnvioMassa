import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

/**
 * GET /api/user/webhooks
 * Retorna os webhooks customizados do usuário
 */
export async function GET() {
  try {
    const user = await requireUser();

    return NextResponse.json({
      webhooks: {
        sendMessage: user.webhookSendMessage,
        createInstance: user.webhookCreateInstance,
        verifyInstance: user.webhookVerifyInstance,
        connectInstance: user.webhookConnectInstance,
        deleteInstance: user.webhookDeleteInstance,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

/**
 * PUT /api/user/webhooks
 * Atualiza os webhooks customizados do usuário
 */
export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const {
      webhookSendMessage,
      webhookCreateInstance,
      webhookVerifyInstance,
      webhookConnectInstance,
      webhookDeleteInstance,
    } = body;

    // Validar URLs se fornecidas
    const webhookFields: Record<string, string | null> = {
      webhookSendMessage: webhookSendMessage || null,
      webhookCreateInstance: webhookCreateInstance || null,
      webhookVerifyInstance: webhookVerifyInstance || null,
      webhookConnectInstance: webhookConnectInstance || null,
      webhookDeleteInstance: webhookDeleteInstance || null,
    };

    for (const [key, value] of Object.entries(webhookFields)) {
      if (value && typeof value === "string") {
        try {
          new URL(value); // Validar se é URL válida
        } catch {
          return NextResponse.json(
            { error: `${key} não é uma URL válida` },
            { status: 400 }
          );
        }
      }
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: webhookFields,
    });

    return NextResponse.json({
      message: "Webhooks atualizados com sucesso",
      webhooks: {
        sendMessage: updated.webhookSendMessage,
        createInstance: updated.webhookCreateInstance,
        verifyInstance: updated.webhookVerifyInstance,
        connectInstance: updated.webhookConnectInstance,
        deleteInstance: updated.webhookDeleteInstance,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
