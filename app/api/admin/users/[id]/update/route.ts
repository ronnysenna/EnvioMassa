import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

/**
 * PUT /api/admin/users/[id]/update
 * Atualizar nome e email de um usuário (apenas admin)
 */
export async function PUT(req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    await requireAdmin();
    const userId = parseInt(params.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nome, email } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 409 }
        );
      }
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { nome, email },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    if (errorMessage.includes("Forbidden") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

