import { NextRequest, NextResponse } from "next/server";
import { checkAuthSession } from "@neup/logica/account/auth";
import { getAuthStartUrl } from "@/inapp/lib/auth-redirect";

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(getAuthStartUrl(req.url));
}

export async function proxy(req: NextRequest) {
  const authAccountToken = req.cookies.get("auth_account")?.value ?? null;
  let authenticated = false;

  try {
    const authResult = await checkAuthSession({ authAccountToken });
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
