import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

/**
 * PATCH /api/admin/users/[id]
 * Atualizar role do usuário (apenas admin)
 */
export async function PATCH(req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const adminUser = await requireAdmin();
    const userId = parseInt(params.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { role } = body;

    if (!role || (role !== "user" && role !== "admin")) {
      return NextResponse.json(
        { error: "Role deve ser 'user' ou 'admin'" },
        { status: 400 }
      );
    }

    // Não permitir que o admin altere sua própria role
    if (adminUser.id === userId) {
      return NextResponse.json(
        { error: "Você não pode alterar sua própria role" },
        { status: 403 }
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

    // Atualizar role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
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

/**
 * DELETE /api/admin/users/[id]
 * Excluir usuário (apenas admin)
 */
export async function DELETE(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const adminUser = await requireAdmin();
    const userId = parseInt(params.id, 10);

    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" },
        { status: 400 }
      );
    }

    // Não permitir que o admin delete a si mesmo
    if (adminUser.id === userId) {
      return NextResponse.json(
        { error: "Você não pode deletar sua própria conta" },
        { status: 403 }
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

    // Deletar usuário (cascade irá deletar todos os dados relacionados)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      message: "Usuário deletado com sucesso",
      deletedUserId: userId 
    });
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

