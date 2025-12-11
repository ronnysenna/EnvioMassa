import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "./prisma";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function requireUser() {
  // compatibilidade com ambientes onde cookies() pode ser Promise
  const cookieStore = await cookies();
  const token = cookieStore.get?.("token")?.value;
  if (!token) throw new Error("Unauthorized");

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    // manter mensagem genérica para não vazar detalhes
    throw new Error("Unauthorized");
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("userId" in decoded)
  ) {
    throw new Error("Unauthorized");
  }

  const maybeUserId = (decoded as { userId?: unknown }).userId;
  const userId =
    typeof maybeUserId === "number" ? maybeUserId : Number(maybeUserId);
  if (Number.isNaN(userId)) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Unauthorized");

  return user;
}

/**
 * Requer que o usuário autenticado seja administrador
 * @throws Error se não autenticado ou não for admin
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

/**
 * Verifica se um usuário tem role de administrador
 */
export function isAdmin(user: User): boolean {
  return user.role === "admin";
}
