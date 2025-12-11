import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

/**
 * POST /api/user/change-password
 * Alterar senha do usuário autenticado
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Verificar senha atual
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      message: "Senha alterada com sucesso" 
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

