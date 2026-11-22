import { NextRequest, NextResponse } from "next/server";
import { getAuthStartUrl } from "@/inapp/lib/auth-redirect";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { AUTH_ACCOUNT_COOKIE_NAME } from "@/inapp/lib/auth-cookie";

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(getAuthStartUrl(req.url));
}

export async function proxy(req: NextRequest) {
  const authToken = req.cookies.get(AUTH_ACCOUNT_COOKIE_NAME)?.value ?? null;
  let authenticated = false;

  try {
    const authResult = await bridgeAuth.checkAuthentication(authToken);
    authenticated = authResult.authenticated;
  } catch {
    // Treat auth service failures as unauthenticated so protected routes stay protected.
  }

  if (!authenticated) {
    return redirectToAuth(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/manage/:path*",
    "/compose/:path*",
    "/drafts/profile/:path*",
    "/drafts/profile",
    "/drafts/manage/:path*",
    "/drafts/manage",
    "/drafts/compose/:path*",
    "/drafts/compose",
  ],
};
