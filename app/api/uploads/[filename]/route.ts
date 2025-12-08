import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Decodifica o filename (caso contenha espaços ou caracteres especiais)
    const decodedFilename = decodeURIComponent(String(filename || ""));

    // Validar nome do arquivo para evitar directory traversal
    if (
      !decodedFilename ||
      decodedFilename.includes("..") ||
      decodedFilename.includes("/")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Tentar múltiplos caminhos para suportar desenvolvimento e execução dentro de containers
    const possiblePaths = [
      path.join(uploadsDir, decodedFilename),
      path.join("/app", "public", "uploads", decodedFilename),
      path.join("/usr/src/app", "public", "uploads", decodedFilename),
      path.join("/tmp", "uploads", decodedFilename),
    ];

    // DEBUG: logs temporários para diagnosticar 404 em runtime remoto (n8n)
    try {
      // Debug logging disabled in production
      if (process.env.NODE_ENV === "development") {
        // Console logging for development only
      }
    } catch (debugErr) {
      // Debug error silently
    }

    // Verificações de existência (para retorno no modo debug)
    const pathChecks = possiblePaths.map((p) => {
      try {
        return { path: p, exists: fs.existsSync(p) };
      } catch (e) {
        return { path: p, exists: false, error: String(e) };
      }
    });

    let filePath: string | null = null;
    for (const pc of pathChecks) {
      if (pc.exists) {
        filePath = pc.path;
        break;
      }
    }

    // Se solicitado modo debug, retornar diagnóstico (protegido por token em .env)
    try {
      // Use request.nextUrl para pegar query params de forma compatível com Next.js
      console.log("[uploads GET] _req.url=", String(_req.url));
      console.log("[uploads GET] _req.nextUrl=", JSON.stringify(_req.nextUrl));
      const debugMode = _req.nextUrl?.searchParams.get("debug");
      const token = _req.nextUrl?.searchParams.get("token");
      if (debugMode === "1") {
        const expected = process.env.UPLOADS_DEBUG_TOKEN;
        if (!expected || token !== expected) {
          return NextResponse.json(
            { error: "Unauthorized (missing/invalid token)" },
            { status: 403 }
          );
        }
        return NextResponse.json(
          {
            decodedFilename,
            processCwd: process.cwd(),
            pathChecks,
            filePathFound: filePath,
          },
          { status: 200 }
        );
      }
    } catch (e) {
      console.warn("[uploads GET] debug-mode check failed", e);
    }

    if (!filePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Ler arquivo
    const fileBuffer = fs.readFileSync(filePath);

    // Determinar MIME type
    const ext = path.extname(decodedFilename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";

    // Retornar arquivo com headers de cache
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
