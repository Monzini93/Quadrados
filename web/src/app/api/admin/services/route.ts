import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const rows = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(rows);
}

const postSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0),
  durationMin: z.number().int().min(5).max(480),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  const err = await requireAdminSession();
  if (err) return err;
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  const maxSort = await prisma.service.aggregate({ _max: { sortOrder: true } });
  const row = await prisma.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? "",
      priceCents: parsed.data.priceCents,
      durationMin: parsed.data.durationMin,
      active: parsed.data.active ?? true,
      sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(row);
}
