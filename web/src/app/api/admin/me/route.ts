import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ user: null });
  return NextResponse.json({ user: s.username });
}
