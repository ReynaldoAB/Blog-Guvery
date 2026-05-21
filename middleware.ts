import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  // Rutas protegidas
  const protectedRoutes = ["/admin", "/dashboard", "/profile"];
  const authRoutes = ["/signin", "/signup"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!token) {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    return NextResponse.next();
  }

  let isTokenValid = false;

  try {
    await verifyAuthToken(token);
    isTokenValid = true;
  } catch {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
  }

  if (isAuthRoute && isTokenValid) {
    const redirectParam = request.nextUrl.searchParams.get("redirect") || "/";
    const safeRedirect =
      redirectParam.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : "/";

    return NextResponse.redirect(new URL(safeRedirect, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
