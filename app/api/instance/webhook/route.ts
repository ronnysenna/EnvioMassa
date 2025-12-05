import { NextResponse } from "next/server";

const N8N_WEBHOOK_URL =
  "https://n8n.ronnysenna.com.br/webhook/verificarInstancia";

export async function GET() {
  try {
    const res = await fetch(N8N_WEBHOOK_URL, { method: "GET" });
    const text = await res.text();

    // Log server-side para ajudar no debug (ver payload cru do n8n)
    // eslint-disable-next-line no-console
    console.log("[api/instance/webhook] n8n raw response:", text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Se não for JSON válido, devolvemos o text cru para inspeção no frontend
      parsed = text;
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch {
    // eslint-disable-next-line no-console
    console.error("[api/instance/webhook] proxy error");
    return NextResponse.json(
      { success: false, error: "Erro ao consultar webhook" },
      { status: 500 }
    );
  }
}
