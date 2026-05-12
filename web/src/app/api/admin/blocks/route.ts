import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { parseDateOnly } from "@/lib/time";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const rows = await prisma.blockedRange.findMany({ orderBy: [{ date: "asc" }, { startMinute: "asc" }] });
  return NextResponse.json(rows);
}

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startMinute: z.number().int().min(0).max(24 * 60),
  endMinute: z.number().int().min(1).max(24 * 60),
});

export async function POST(req: Request) {
  const err = await requireAdminSession();
  if (err) return err;
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { date, startMinute, endMinute } = parsed.data;
  if (startMinute >= endMinute) {
    return NextResponse.json({ error: "Início deve ser antes do fim." }, { status: 400 });
  }
  const row = await prisma.blockedRange.create({
    data: { date: parseDateOnly(date), startMinute, endMinute },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const err = await requireAdminSession();
  if (err) return err;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.blockedRange.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
