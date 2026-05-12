import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await requireAdminSession();
  if (err) return err;
  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  try {
    const row = await prisma.service.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await requireAdminSession();
  if (err) return err;
  const { id } = await ctx.params;
  try {
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Não é possível excluir (pode haver agendamentos)." }, { status: 400 });
  }
}
