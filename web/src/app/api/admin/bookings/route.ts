import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/admin-guard";
import { parseDateOnly } from "@/lib/time";

export async function GET(req: NextRequest) {
  const err = await requireAdminSession();
  if (err) return err;
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const where: Prisma.BookingWhereInput = {};
  if (from && to) {
    where.date = {
      gte: parseDateOnly(from),
      lte: parseDateOnly(to),
    };
  } else if (from) {
    where.date = { gte: parseDateOnly(from) };
  } else if (to) {
    where.date = { lte: parseDateOnly(to) };
  }
  const rows = await prisma.booking.findMany({
    where,
    orderBy: [{ date: "desc" }, { startMinute: "desc" }],
    include: {
      services: { include: { service: true } },
    },
  });
  return NextResponse.json(rows);
}
