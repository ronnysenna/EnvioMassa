import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

/**
 * GET /api/admin/users
 * Listar todos os usuários (apenas admin)
 */
export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            contacts: true,
            images: true,
            groups: true,
            templates: true,
            instances: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users });
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
 * POST /api/admin/users
 * Criar novo usuário (apenas admin)
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { nome, email, password, role = "user" } = body;

    if (!nome || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    if (role !== "user" && role !== "admin") {
      return NextResponse.json(
        { error: "Role deve ser 'user' ou 'admin'" },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um usuário com este email" },
        { status: 409 }
      );
    }

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        nome,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
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

