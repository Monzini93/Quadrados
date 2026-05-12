import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeAvailability } from "@/lib/availability";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const ids = req.nextUrl.searchParams.get("serviceIds");
  if (!date || !ids) {
    return NextResponse.json({ error: "Parâmetros date e serviceIds são obrigatórios." }, { status: 400 });
  }
  const serviceIds = ids.split(",").filter(Boolean);
  const result = await computeAvailability(prisma, { dateIso: date, serviceIds });
  return NextResponse.json(result);
}
