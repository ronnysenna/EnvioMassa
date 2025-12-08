import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";
import { getWebhookUrl } from "@/lib/webhooks";

/**
 * POST /api/instances/[id]/connect
 * Conecta uma instância específica do usuário
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
    const { action } = body;

    if (action === "connect") {
      // Atualizar status para connecting
      const updated = await prisma.instance.update({
        where: { id: instanceId },
        data: { status: "connecting", lastUpdate: new Date() },
      });

      // Chamar webhook de conexão com o nome da instância
      try {
        const connectWebhookUrl = getWebhookUrl("CONECTAR_INSTANCIA");
        const res = await fetch(connectWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceName: instance.instanceName,
            userId: userId,
          }),
        });

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          let qrCodeData: string | null = null;

          // Se for imagem (binário)
          if (contentType.includes("image")) {
            const buffer = await res.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            qrCodeData = `data:${contentType};base64,${base64}`;
            console.log(
              "📸 QR Code recebido como imagem binária, tamanho:",
              base64.length
            );
          } else {
            // Se for JSON
            const data = await res.json();
            console.log(
              "📋 Resposta JSON do webhook (completa):",
              JSON.stringify(data, null, 2)
            );
            console.log("📋 Chaves presentes:", Object.keys(data));
            qrCodeData = data?.qrCode;
            console.log("📋 qrCodeData extraído?", !!qrCodeData);
            if (qrCodeData) {
              console.log(
                "✅ QR Code JSON extraído, tamanho:",
                qrCodeData.length
              );
              console.log(
                "✅ Primeiros 150 chars:",
                qrCodeData.substring(0, 150)
              );
            } else {
              console.warn("⚠️ qrCode está vazio ou indefinido. Data=", data);
            }
          }

          // Atualizar QR code se recebido
          if (qrCodeData) {
            console.log(
              "✅ QR Code salvo no BD, primeiros 100 chars:",
              qrCodeData.substring(0, 100)
            );
            const withQr = await prisma.instance.update({
              where: { id: instanceId },
              data: { qrCode: qrCodeData },
            });
            return NextResponse.json({ instance: withQr });
          } else {
            console.warn(
              "⚠️ Nenhum QR code foi extraído da resposta do webhook"
            );
          }
        }
      } catch (err) {
        console.error("Erro ao chamar webhook de conexão:", err);
      }

      return NextResponse.json({ instance: updated });
    } else if (action === "disconnect") {
      // Chamar webhook de desconexão
      try {
        const disconnectWebhookUrl = getWebhookUrl("DESCONECTAR_INSTANCIA");
        await fetch(disconnectWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instanceName: instance.instanceName,
            userId: userId,
          }),
        });
      } catch (err) {
        console.error("Erro ao chamar webhook de desconexão:", err);
      }

      const updated = await prisma.instance.update({
        where: { id: instanceId },
        data: { status: "disconnected", qrCode: null, lastUpdate: new Date() },
      });

      return NextResponse.json({ instance: updated });
    } else {
      return NextResponse.json(
        { error: "Action deve ser 'connect' ou 'disconnect'" },
        { status: 400 }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
