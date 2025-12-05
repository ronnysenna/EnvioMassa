import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch(
      "https://n8n.ronnysenna.com.br/webhook/reiniciarInstancia",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!res.ok) {
      throw new Error(`N8N webhook error: ${res.status}`);
    }

    const data = await res.json();
    console.log("[restart] n8n response:", data);

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[restart] error:", error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
