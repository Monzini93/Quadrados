import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const rows = await prisma.weekdaySchedule.findMany({ orderBy: { weekday: "asc" } });
  return NextResponse.json(rows);
}

const putSchema = z.object({
  schedules: z.array(
    z.object({
      weekday: z.number().int().min(0).max(6),
      isOpen: z.boolean(),
      openMinute: z.number().int().min(0).max(24 * 60 - 1),
      closeMinute: z.number().int().min(1).max(24 * 60),
    })
  ),
});

export async function PUT(req: Request) {
  const err = await requireAdminSession();
  if (err) return err;
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  for (const s of parsed.data.schedules) {
    if (s.isOpen && s.openMinute >= s.closeMinute) {
      return NextResponse.json({ error: "Horário de abertura deve ser antes do fechamento." }, { status: 400 });
    }
    await prisma.weekdaySchedule.upsert({
      where: { weekday: s.weekday },
      create: s,
      update: {
        isOpen: s.isOpen,
        openMinute: s.openMinute,
        closeMinute: s.closeMinute,
      },
    });
  }
  const rows = await prisma.weekdaySchedule.findMany({ orderBy: { weekday: "asc" } });
  return NextResponse.json(rows);
}
