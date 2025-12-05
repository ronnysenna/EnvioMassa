import { NextRequest, NextResponse } from "next/server";

// Cache em memória para armazenar dados da instância
let instanceData = {
  instancia: null as string | null,
  status: null as string | null,
  qrCode: null as string | null,
  lastUpdate: new Date().toISOString(),
  connecting: false,
};

const STATUS_WEBHOOK_URL =
  process.env.N8N_WEBHOOK_URL ||
  "https://n8n.ronnysenna.com.br/webhook/verificarInstancia";

/**
 * GET /api/instance/connect
 * Retorna o status atual da instância — agora consulta o webhook de verificação para obter o estado real.
 */
export async function GET() {
  try {
    // Tentar buscar diretamente do webhook de verificação (n8n)
    const res = await fetch(STATUS_WEBHOOK_URL, { method: "GET" });
    if (res.ok) {
      const contentType = res.headers.get("content-type") ?? "";
      let json: Record<string, unknown> = {};
      if (contentType.includes("application/json")) {
        json = (await res.json()) as Record<string, unknown>;
      } else {
        const text = await res.text();
        try {
          json = JSON.parse(text) as Record<string, unknown>;
        } catch {
          json = { message: text } as Record<string, unknown>;
        }
      }

      const get = (k: string) => (Object.hasOwn(json, k) ? json[k] : undefined);

      // Se payload vier como array [ { success:true, data:[...] } ] usar o primeiro elemento
      let payload: Record<string, unknown> = json;
      if (Array.isArray(json) && json.length > 0)
        payload = json[0] as Record<string, unknown>;
      // se payload tem data array, pegar data[0]
      if (Object.hasOwn(payload, "data")) {
        const maybeData = payload["data"] as unknown;
        if (
          Array.isArray(maybeData) &&
          maybeData.length > 0 &&
          typeof maybeData[0] === "object"
        ) {
          payload = maybeData[0] as Record<string, unknown>;
        } else if (typeof maybeData === "object" && maybeData !== null) {
          payload = maybeData as Record<string, unknown>;
        }
      }

      const instancia = (
        Object.hasOwn(payload, "instancia")
          ? payload["instancia"]
          : Object.hasOwn(payload, "instance")
          ? payload["instance"]
          : Object.hasOwn(payload, "name")
          ? payload["name"]
          : Object.hasOwn(payload, "id")
          ? payload["id"]
          : null
      ) as string | null;
      const status = (
        Object.hasOwn(payload, "connectionStatus")
          ? payload["connectionStatus"]
          : Object.hasOwn(payload, "status")
          ? payload["status"]
          : null
      ) as string | null;
      const qrCode = (
        Object.hasOwn(payload, "qrCode")
          ? payload["qrCode"]
          : Object.hasOwn(payload, "qr")
          ? payload["qr"]
          : Object.hasOwn(payload, "qrcode")
          ? payload["qrcode"]
          : null
      ) as string | null;
      const lastUpdate = (
        Object.hasOwn(payload, "lastUpdate")
          ? payload["lastUpdate"]
          : Object.hasOwn(payload, "updatedAt")
          ? payload["updatedAt"]
          : null
      ) as string | null;
      const connecting = (
        Object.hasOwn(payload, "connecting")
          ? Boolean(payload["connecting"])
          : false
      ) as boolean;

      // Normalizar status: exemplo connectionStatus: 'open' => online
      let normalizedStatus: string | null = null;
      if (status) {
        const s = String(status).toLowerCase();
        if (["open", "online", "connected"].includes(s))
          normalizedStatus = "online";
        else if (["closed", "offline", "disconnected"].includes(s))
          normalizedStatus = "offline";
        else if (["connecting", "pending"].includes(s))
          normalizedStatus = "connecting";
        else normalizedStatus = s;
      }

      // Atualizar cache
      instanceData.instancia = instancia ?? instanceData.instancia;
      instanceData.status = normalizedStatus ?? instanceData.status;
      instanceData.qrCode = qrCode ?? instanceData.qrCode;
      instanceData.lastUpdate =
        (lastUpdate as string) ?? instanceData.lastUpdate;
      instanceData.connecting = connecting ?? instanceData.connecting;

      return NextResponse.json({
        success: true,
        data: {
          instancia: instanceData.instancia,
          status: instanceData.status,
          qrCode: instanceData.qrCode,
          lastUpdate: instanceData.lastUpdate,
          connecting: instanceData.connecting,
        },
      });
    }
  } catch (err) {
    // ignorar e retornar cache
    console.error("Error fetching status from webhook:", err);
  }

  // fallback: retornar cache em memória
  return NextResponse.json({
    success: true,
    data: {
      instancia: instanceData.instancia,
      status: instanceData.status,
      qrCode: instanceData.qrCode,
      lastUpdate: instanceData.lastUpdate,
      connecting: instanceData.connecting,
    },
  });
}

/**
 * POST /api/instance/connect
 * Chama o webhook do n8n para conectar a instância
 * O webhook retorna a imagem PNG/JPG diretamente
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = (body?.action ?? "connect") as string;

    if (action === "disconnect") {
      const DISCONNECT_WEBHOOK =
        process.env.N8N_DISCONNECT_WEBHOOK ||
        "https://n8n.ronnysenna.com.br/webhook/desconectarinstancia";

      console.log(`🔌 Chamando webhook de desconexão: ${DISCONNECT_WEBHOOK}`);

      // opcional: enviar nome da instância para o webhook
      const payload = { instancia: instanceData.instancia };

      const resp = await fetch(DISCONNECT_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const contentType = resp.headers.get("content-type") ?? "";
      let parsedResponse: unknown = {};
      if (contentType.includes("application/json")) {
        parsedResponse = await resp.json().catch(() => ({}));
      } else {
        const text = await resp.text().catch(() => "");
        try {
          parsedResponse = JSON.parse(text);
        } catch {
          parsedResponse = { message: text };
        }
      }

      // Atualizar cache local para refletir desconexão
      instanceData.status = "offline";
      instanceData.connecting = false;
      instanceData.lastUpdate = new Date().toISOString();

      // Retornar resposta normalizada para frontend (mesmo formato do GET)
      return NextResponse.json({
        success: true,
        message: "Instância desconectada",
        data: {
          instancia: instanceData.instancia,
          status: instanceData.status,
          qrCode: instanceData.qrCode,
          lastUpdate: instanceData.lastUpdate,
          connecting: instanceData.connecting,
          // incluir qualquer payload adicional retornado pelo webhook para debug
          webhookResponse: parsedResponse,
        },
      });
    }

    // fallback: comportamento de conectar (existing implementation)
    const webhookUrl =
      process.env.N8N_CONNECT_WEBHOOK ||
      "https://n8n.ronnysenna.com.br/webhook/conectarinstancia";

    console.log(`🔗 Chamando webhook de conexão: ${webhookUrl}`);

    instanceData.connecting = true;
    instanceData.lastUpdate = new Date().toISOString();

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(10000), // 10 segundo timeout
    });

    if (!response.ok) {
      instanceData.connecting = false;
      return NextResponse.json(
        { error: `Webhook retornou status ${response.status}` },
        { status: response.status }
      );
    }

    // Verificar o tipo de conteúdo
    const contentType = response.headers.get("content-type");
    console.log(`📦 Content-Type: ${contentType}`);

    let qrCodeData: string | null = null;
    let responseData: Record<string, unknown> = {};

    if (contentType?.includes("image")) {
      // Se for uma imagem, converter para base64
      console.log("📸 Webhook retornou imagem!");
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      // Determinar o tipo de imagem
      let mimeType = "image/png";
      if (contentType?.includes("jpeg") || contentType?.includes("jpg")) {
        mimeType = "image/jpeg";
      } else if (contentType?.includes("svg")) {
        mimeType = "image/svg+xml";
      }

      qrCodeData = `data:${mimeType};base64,${base64}`;
      responseData = {
        qrCode: qrCodeData,
        instancia: "evolution",
      } as Record<string, unknown>;
    } else if (contentType?.includes("json")) {
      // Se for JSON, parsear normalmente
      console.log("📋 Webhook retornou JSON!");
      responseData = (await response.json()) as Record<string, unknown>;
      qrCodeData = (responseData.qrCode as string) || null;
    } else if (contentType?.includes("text")) {
      // Se for texto/SVG, usar como data URL
      console.log("📝 Webhook retornou texto!");
      const text = await response.text();
      if (text.startsWith("<svg")) {
        qrCodeData = `data:image/svg+xml;base64,${Buffer.from(text).toString(
          "base64"
        )}`;
      } else {
        qrCodeData = text;
      }
      responseData = { qrCode: qrCodeData } as Record<string, unknown>;
    } else {
      // Por padrão, assumir que é um blob/imagem
      console.log("🖼️ Webhook retornou blob!");
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      qrCodeData = `data:image/png;base64,${base64}`;
      responseData = { qrCode: qrCodeData } as Record<string, unknown>;
    }

    // Armazenar no cache
    if (qrCodeData) {
      instanceData.qrCode = qrCodeData;
    }
    if (responseData.instancia) {
      instanceData.instancia = String(responseData.instancia);
    }

    console.log(`✅ QR Code obtido com sucesso`);

    return NextResponse.json({
      success: true,
      message: "QR code gerado. Escaneie para conectar.",
      data: {
        qrCode: qrCodeData,
        instancia: (responseData.instancia as string) || "evolution",
        ...responseData,
      },
    });
  } catch (error) {
    instanceData.connecting = false;
    console.error("❌ Error calling connect webhook:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Webhook timeout - instância pode estar indisponível" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Falha ao conectar instância",
      },
      { status: 500 }
    );
  }
}
