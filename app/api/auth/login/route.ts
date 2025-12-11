import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password)
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return NextResponse.json({ error: "Email ou senha inválidos" }, { status: 401 });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json({ 
      id: user.id, 
      nome: user.nome,
      email: user.email,
      role: user.role
    });

    // Hardened cookie attributes for stateless JWT
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: IS_PROD,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    } as Parameters<typeof res.cookies.set>[2];

    res.cookies.set("token", token, cookieOptions);
    return res;
  } catch (unknownErr) {
    return NextResponse.json(
      { error: getErrorMessage(unknownErr) },
      { status: 500 },
    );
  }
}
