import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function DELETE(req: Request) {
  try {
    // autentica usuário
    const user = await requireUser();
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const rawIds = Array.isArray(body.ids) ? body.ids : [];
    const ids: number[] = rawIds
      .map((v: unknown) => Number(v))
      .filter((n) => Number.isInteger(n));

    if (ids.length === 0) {
      return NextResponse.json(
        { deleted: 0, message: "Nenhum id válido fornecido" },
        { status: 400 }
      );
    }

    // Deleta apenas contatos pertencentes ao usuário autenticado
    const result = await prisma.contact.deleteMany({
      where: {
        id: { in: ids },
        userId,
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (err) {
    console.error("Error in /api/contacts/bulk-delete", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
