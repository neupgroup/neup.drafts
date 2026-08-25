import { NextRequest, NextResponse } from "next/server";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";

export interface AuthContext {
  accountId: string;
}

export const withAuth = (
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) => {
  return async (req: NextRequest) => {
    const authAccountToken = req.cookies.get("auth_account")?.value ?? null;

    // 1. Authentication
    const authResult = await bridgeAuth.checkAuthentication(authAccountToken);

    if (!authResult.authenticated) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    // 2. Identity
    const accountId = await bridgeAuth.getAccountId(authAccountToken);

    if (!accountId) {
      return new NextResponse("Unauthorized", {
        status: 401,
      });
    }

    // 3. Authorization
    const authorized = await bridgeAuth.checkAuthorization(accountId);

    if (!authorized) {
      return new NextResponse("Forbidden", {
        status: 403,
      });
    }

    // 4. Authenticated + authorized
    return handler(req, { accountId });
  };
};
