import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { getWebhookUrl } from "@/lib/webhooks";

/**
 * POST /api/instances/[id]/verify
 * Verifica se uma instância está conectada
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await (context?.params ?? ({} as { id: string }));
    const user = await requireUser();
    const userId = user.id;
    const instanceId = parseInt(params.id, 10);

    const instance = await prisma.instance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      return NextResponse.json(
        { error: "Instância não encontrada" },
        { status: 404 }
      );
    }

    if (instance.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { instanceName } = body;

    const nameToCheck = instanceName || instance.instanceName;

    // Chamar webhook de verificação
    try {
      const verifyWebhookUrl = getWebhookUrl("VERIFICAR_INSTANCIA");

      const res = await fetch(verifyWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: nameToCheck,
          userId: userId,
        }),
      });

      if (res.ok) {
        let data = await res.json();

        // Se a resposta for um array (pode acontecer com N8N), pegar o primeiro elemento
        if (Array.isArray(data) && data.length > 0) {
          data = data[0];
        }

        // Aceita: connected=true, connected="true", status=online, status=open
        const isConnected =
          data?.connected === true ||
          data?.connected === "true" ||
          data?.status === "online" ||
          data?.status === "open";

        // Se conectado, atualizar status no BD
        if (isConnected) {
          const updated = await prisma.instance.update({
            where: { id: instanceId },
            data: { status: "online" },
          });
          return NextResponse.json({
            connected: true,
            instance: updated,
          });
        }

        return NextResponse.json({
          connected: false,
          instance,
        });
      } else {
        return NextResponse.json(
          {
            connected: false,
            instance,
            warning: "Webhook retornou erro",
          },
          { status: 200 }
        );
      }
    } catch (webhookError) {
      return NextResponse.json(
        {
          connected: false,
          instance,
          error: "Erro ao chamar webhook",
        },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
