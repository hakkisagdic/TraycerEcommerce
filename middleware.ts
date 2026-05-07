import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const role = req.auth?.user?.role;
  const isAuthed = Boolean(req.auth?.user);

  const isAdminPath = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isCommentsApi = pathname.startsWith("/api/comments");
  const isLoginPath = pathname === "/login";
  const isRegisterPath = pathname === "/register";

  if (isLoginPath || isRegisterPath) {
    if (isAuthed) {
      const target = role === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(target, req.nextUrl));
    }
    return NextResponse.next();
  }

  if (isAdminPath) {
    if (role !== "admin") {
      const loginUrl = new URL("/login", req.nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (isAdminApi) {
    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (isCommentsApi) {
    if (role !== "admin" && role !== "reader") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/comments/:path*",
    "/api/posts/:path*",
    "/api/categories/:path*",
    "/api/tags/:path*",
    "/api/media/:path*",
    "/login",
    "/register",
  ],
};
