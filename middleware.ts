import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login sayfasında token varsa dashboard'a yönlendir
  if (pathname === "/admin/login") {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }

  // Diğer tüm /admin/* rotaları için token zorunlu
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.redirect(new URL("/admin/login", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
