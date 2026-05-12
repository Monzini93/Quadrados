import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { parseDateOnly } from "@/lib/time";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const rows = await prisma.specialDayHours.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(rows);
}

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  openMinute: z.number().int().min(0).max(24 * 60 - 1),
  closeMinute: z.number().int().min(1).max(24 * 60),
});

export async function POST(req: Request) {
  const err = await requireAdminSession();
  if (err) return err;
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const { date, openMinute, closeMinute } = parsed.data;
  if (openMinute >= closeMinute) {
    return NextResponse.json({ error: "Abertura deve ser antes do fechamento." }, { status: 400 });
  }
  const row = await prisma.specialDayHours.upsert({
    where: { date: parseDateOnly(date) },
    create: { date: parseDateOnly(date), openMinute, closeMinute },
    update: { openMinute, closeMinute },
  });
  return NextResponse.json(row);
}

export async function DELETE(req: NextRequest) {
  const err = await requireAdminSession();
  if (err) return err;
  const dateStr = req.nextUrl.searchParams.get("date");
  if (!dateStr) return NextResponse.json({ error: "date obrigatório" }, { status: 400 });
  await prisma.specialDayHours.deleteMany({ where: { date: parseDateOnly(dateStr) } });
  return NextResponse.json({ ok: true });
}
