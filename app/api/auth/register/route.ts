import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";
import { requireAdmin } from "@/lib/serverAuth";

/**
 * POST /api/auth/register
 * Criar novo usuário - SOMENTE ADMIN
 */
export async function POST(req: Request) {
  try {
    // Apenas administradores podem criar novos usuários
    await requireAdmin();

    const body = await req.json();
    const { nome, email, password } = body;
    
    if (!nome || !email || !password)
      return NextResponse.json({ error: "Nome, email e senha são obrigatórios" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return NextResponse.json({ error: "Usuário já existe com este email" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { nome, email, password: hashed },
    });

    return NextResponse.json({ 
      id: user.id, 
      nome: user.nome,
      email: user.email,
      role: user.role 
    });
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    if (errorMessage.includes("Forbidden") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Apenas administradores podem criar novos usuários" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
