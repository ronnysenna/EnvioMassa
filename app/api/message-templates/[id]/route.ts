import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function PUT(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const userId = user.id;
    const templateId = parseInt(params.id, 10);

    const body = await _req.json().catch(() => ({}));
    const { name, content } = body;

    // Verificar que o template pertence ao usuário
    const template = await prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: Record<string, string> = {};
    if (typeof name === "string") data.name = name;
    if (typeof content === "string") data.content = content;

    const updated = await prisma.messageTemplate.update({
      where: { id: templateId },
      data,
    });

    return NextResponse.json({ template: updated });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const userId = user.id;
    const templateId = parseInt(params.id, 10);

    const template = await prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    if (template.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.messageTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json({ message: "Template deletado com sucesso" });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
