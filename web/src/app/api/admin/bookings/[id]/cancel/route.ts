import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const err = await requireAdminSession();
  if (err) return err;
  const { id } = await ctx.params;
  try {
    await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
  }
}
