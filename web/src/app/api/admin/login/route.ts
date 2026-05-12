import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = loginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 400 });
  }
  const { username, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { username } });
  if (!admin) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Usuário ou senha incorretos." }, { status: 401 });
  }
  try {
    const token = await signAdminToken(admin.id, admin.username);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json(
      { error: "Configure JWT_SECRET no ambiente (mín. 16 caracteres)." },
      { status: 503 }
    );
  }
}
