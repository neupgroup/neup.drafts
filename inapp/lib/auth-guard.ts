import { NextRequest, NextResponse } from "next/server";
import { verifyTokenWithBridge, BridgeUser } from "@/inapp/lib/bridge-auth.service";

export interface AuthContext {
  user: BridgeUser;
}

export const withAuth = (
  handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
) => {
  return async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization");
    const tokenFromStorage = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;
    const tokenFromCookies = req.cookies.get("auth_token")?.value;

    const { searchParams } = new URL(req.url);
    const tokenFromCallback = searchParams.get("token");

    const activeToken =
      tokenFromStorage || tokenFromCookies || tokenFromCallback;

    if (!activeToken) {
      return NextResponse.json(
        { error: "Unauthorized: No token found." },
        { status: 401 },
      );
    }

    const user = await verifyTokenWithBridge(activeToken);
    if (!user) {
      return NextResponse.json(
        { error: "Forbidden: Bridge rejected grant." },
        { status: 403 },
      );
    }

    return handler(req, { user });
  };
};
