import { NextRequest, NextResponse } from "next/server";

// Store instance status in memory (simple cache)
let instanceStatus: {
  instancia: string;
  status: "open" | "closed" | string;
  lastUpdate: Date;
} | null = null;

/**
 * POST /api/instance/webhook
 * Recebe webhook do n8n com o status da instância
 * Body: { instancia: string, status: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { instancia, status } = body;

    if (!instancia || !status) {
      return NextResponse.json(
        { error: "Missing instancia or status" },
        { status: 400 }
      );
    }

    // Armazenar status em memória
    instanceStatus = {
      instancia,
      status,
      lastUpdate: new Date(),
    };

    console.log(`✅ Instance status updated: ${instancia} - ${status}`);

    return NextResponse.json({
      success: true,
      data: instanceStatus,
    });
  } catch (error) {
    console.error("Error updating instance status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/instance/webhook
 * Retorna o status atual da instância
 */
export async function GET() {
  try {
    // Se não houver status armazenado, considerar offline
    if (!instanceStatus) {
      return NextResponse.json({
        success: true,
        data: {
          instancia: "unknown",
          status: "offline",
          lastUpdate: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: instanceStatus,
    });
  } catch (error) {
    console.error("Error fetching instance status:", error);
    return NextResponse.json(
      { error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
