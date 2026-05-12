import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const s = await prisma.shopSettings.findUnique({ where: { id: "main" } });
  return NextResponse.json({
    adminWhatsAppDigits: s?.adminWhatsAppDigits ?? "",
    slotIntervalMinutes: s?.slotIntervalMinutes ?? 30,
  });
}

const putSchema = z.object({
  adminWhatsAppDigits: z.string().max(20).optional(),
  slotIntervalMinutes: z.number().int().min(5).max(120).optional(),
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
  const data = parsed.data;
  const updated = await prisma.shopSettings.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      adminWhatsAppDigits: data.adminWhatsAppDigits?.replace(/\D/g, "") ?? "",
      slotIntervalMinutes: data.slotIntervalMinutes ?? 30,
    },
    update: {
      ...(data.adminWhatsAppDigits !== undefined && {
        adminWhatsAppDigits: data.adminWhatsAppDigits.replace(/\D/g, ""),
      }),
      ...(data.slotIntervalMinutes !== undefined && { slotIntervalMinutes: data.slotIntervalMinutes }),
    },
  });
  return NextResponse.json(updated);
}
