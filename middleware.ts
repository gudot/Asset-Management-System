import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

const roles = ["admin", "auditor", "accountant"] as const;
type UserRole = (typeof roles)[number];

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && roles.includes(value as UserRole);
}

function getUserRole(user: User | null) {
  const role = user?.app_metadata?.role;
  return isUserRole(role) ? role : null;
}

function canAccessPath(role: UserRole | null, pathname: string) {
  if (!role) return false;

  const restrictedPaths: Record<UserRole, string[]> = {
    admin: [],
    auditor: ["/users"],
    accountant: ["/audits", "/reports", "/logs", "/users"],
  };

  return !restrictedPaths[role].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, allow all requests through
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = [
    "/",
    "/branches",
    "/assets",
    "/transfers",
    "/maintenance",
    "/audits",
    "/reports",
    "/disposals",
    "/categories",
    "/logs",
    "/users",
  ];

  const isProtectedPath = protectedPaths.some(
    (path) =>
      request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith(`${path}/`)
  );

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const userRole = getUserRole(user);

  if (isProtectedPath && user && !userRole) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (isProtectedPath && user && !canAccessPath(userRole, request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname === "/signup") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/" : "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (
    user &&
    request.nextUrl.pathname === "/login"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = userRole ? "/" : "/unauthorized";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
