import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PAGE_PREFIXES = ["/", "/roadmap"];
const PROTECTED_PAGE_PREFIXES = [
  "/app",
  "/auth",
  "/onboarding",
  "/dashboard",
  "/feed",
  "/projects",
  "/matches",
  "/notifications",
  "/post-project",
  "/manage-projects",
  "/profile",
  "/settings",
];

function hasSessionCookie(request: NextRequest) {
  return Boolean(request.cookies.get("better-auth.session_token")?.value);
}

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function isPublicPage(pathname: string) {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix);
}

function isProtectedPage(pathname: string) {
  return PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const isAuthed = hasSessionCookie(request);

  if (pathname.startsWith("/api/")) {
    if (!isAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  if (!isAuthed && isProtectedPage(pathname) && !isPublicPage(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
