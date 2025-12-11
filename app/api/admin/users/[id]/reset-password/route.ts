import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

/**
 * POST /api/admin/users/[id]/reset-password
 * Resetar senha de um usuário (apenas admin)
 */
export async function POST(req: Request, context: NextContextWithParams) {
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
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: "Nova senha é obrigatória" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
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

    // Atualizar senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ 
      message: "Senha resetada com sucesso" 
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

