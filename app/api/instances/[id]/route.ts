import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { getWebhookUrl } from "@/lib/webhooks";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

/**
 * GET /api/instances/[id]
 * Retorna os detalhes de uma instância específica
 */
export async function GET(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
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

    return NextResponse.json({ instance });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

/**
 * PUT /api/instances/[id]
 * Atualiza status ou QR code da instância
 */
export async function PUT(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const userId = user.id;
    const instanceId = parseInt(params.id, 10);

    const body = await _req.json().catch(() => ({}));
    const { status, qrCode } = body;

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

    const data: Record<string, unknown> = { lastUpdate: new Date() };
    if (typeof status === "string") data.status = status;
    if (typeof qrCode === "string") data.qrCode = qrCode;

    const updated = await prisma.instance.update({
      where: { id: instanceId },
      data,
    });

    return NextResponse.json({ instance: updated });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

/**
 * DELETE /api/instances/[id]
 * Deleta uma instância
 */
export async function DELETE(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
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

    // Chamar webhook de deleção
    try {
      const deleteWebhookUrl = getWebhookUrl("DELETAR_INSTANCIA");
      await fetch(deleteWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName: instance.instanceName,
          userId: userId,
        }),
      });
      console.log(
        `🗑️  Webhook de deleção chamado para: ${instance.instanceName}`
      );
    } catch (webhookErr) {
      console.error("Erro ao chamar webhook de deleção:", webhookErr);
      // Continuar com deleção mesmo se webhook falhar
    }

    // Deletar instância do BD
    await prisma.instance.delete({
      where: { id: instanceId },
    });

    console.log(`✅ Instância ${instance.instanceName} deletada do BD`);

    return NextResponse.json({ message: "Instância deletada com sucesso" });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
