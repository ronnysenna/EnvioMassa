import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

/**
 * PUT /api/user/update-profile
 * Atualizar nome e email do usuário autenticado
 */
export async function PUT(req: Request) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const { nome, email } = body;

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o email já está em uso por outro usuário
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 409 }
        );
      }
    }

    // Atualizar dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { nome, email },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ 
      message: "Perfil atualizado com sucesso",
      user: updatedUser
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    if (errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

