import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/*
 * Fast redirects based on whether a session cookie exists.
 * This is only a convenience: pages and server actions verify the session for real.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = !!getSessionCookie(request);

  if (pathname === "/") {
    return NextResponse.redirect(new URL(signedIn ? "/app" : "/login", request.url));
  }
  if ((pathname === "/login" || pathname === "/signup") && signedIn) {
    return NextResponse.redirect(new URL("/app", request.url));
  }
  if (pathname.startsWith("/app") && !signedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/signup", "/app/:path*"],
};
