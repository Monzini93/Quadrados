import { NextResponse } from "next/server";
import { getAdminSession } from "./auth";

export async function requireAdminSession(): Promise<NextResponse | null> {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  return null;
}
