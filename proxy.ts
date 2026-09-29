import { NextRequest, NextResponse } from "next/server";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { getAuthStartUrl } from "@/inapp/lib/auth-redirect";

function redirectToAuth(req: NextRequest) {
  return NextResponse.redirect(getAuthStartUrl(req.url));
}

export async function proxy(req: NextRequest) {
  const authAccountToken = req.cookies.get("auth_account")?.value ?? null;

  const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

  if (!authResult.authenticated) {
    return redirectToAuth(req);
  }

  const accountId = await bridgeAuth.getAccountId(authAccountToken);

  if (!accountId) {
    return redirectToAuth(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*"],
};
