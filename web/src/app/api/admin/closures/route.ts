import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { parseDateOnly } from "@/lib/time";

export async function GET() {
  const err = await requireAdminSession();
  if (err) return err;
  const rows = await prisma.dateClosure.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(rows);
}

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: Request) {
  const err = await requireAdminSession();
  if (err) return err;
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  try {
    const row = await prisma.dateClosure.create({
      data: { date: parseDateOnly(parsed.data.date) },
    });
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Data já cadastrada como fechada." }, { status: 409 });
  }
}

export async function DELETE(req: NextRequest) {
  const err = await requireAdminSession();
  if (err) return err;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  await prisma.dateClosure.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
