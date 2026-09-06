import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const passcode = process.env.APP_PASSCODE;
  // If no passcode gate configured, proceed without blocking
  if (!passcode || passcode.trim() === "") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow login page, static assets, and Next.js internal routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes("favicon.ico")
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get("cbt_session")?.value;

  const secret = process.env.AUTH_SECRET || "cbt-trainer-punjab-group-b-exam-secret";
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + ":" + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const expectedToken = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  if (!sessionToken || sessionToken !== expectedToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
