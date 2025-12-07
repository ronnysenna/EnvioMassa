import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const templates = await prisma.messageTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const { name, content } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Nome e conteúdo são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se já existe template com esse nome
    const existing = await prisma.messageTemplate.findUnique({
      where: { userId_name: { userId, name } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um template com esse nome" },
        { status: 409 }
      );
    }

    const template = await prisma.messageTemplate.create({
      data: { userId, name, content },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
