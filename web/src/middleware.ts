import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, ADMIN_COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  const session = await verifyAdminToken(token);
  if (!session) {
    const res = NextResponse.redirect(new URL("/admin/login", request.url));
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
