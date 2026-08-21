import { NextRequest, NextResponse } from "next/server";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import baseJson from "@/logica/base.json";

function redirectToAuth(req: NextRequest) {
  const authStartUrl = new URL("/account/auth/start", baseJson.neupid);

  authStartUrl.searchParams.set("authenticatesTo", req.url);

  return NextResponse.redirect(authStartUrl);
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

  const authorized = await bridgeAuth.checkAuthorization(accountId);

  if (!authorized) {
    return redirectToAuth(req);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/manage/:path*"],
};
