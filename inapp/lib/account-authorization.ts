import { getAuthAccountToken } from "@/inapp/lib/auth-cookie";
import { bridgeAuth } from "@/inapp/lib/bridge-auth.service";
import { verifyNeupIdToken } from "@neup/logica/account/token/verify";

export interface AuthorizedAccount {
  accountId: string;
  authAccountToken: string;
  isAdmin: boolean;
}

// Validate the current session and, when requested, its application permission.
export async function getAuthorizedAccount(
  permission?: string,
): Promise<AuthorizedAccount | null> {
  try {
    const authAccountToken = await getAuthAccountToken();
    if (!authAccountToken) return null;

    const authResult = await bridgeAuth.checkAuthentication(authAccountToken);
    if (!authResult.authenticated) return null;

    const [tokenResult, account] = await Promise.all([
      verifyNeupIdToken(authAccountToken),
      bridgeAuth.getCurrentAccount(authAccountToken),
    ]);
    const accountId = tokenResult.valid
      ? tokenResult.payload.aid ?? await bridgeAuth.getAccountId(authAccountToken)
      : await bridgeAuth.getAccountId(authAccountToken);

    if (!accountId) return null;

    if (permission && !(await bridgeAuth.checkAuthorization(accountId, permission))) {
      return null;
    }

    return {
      accountId,
      authAccountToken,
      isAdmin: account?.status.toUpperCase() === "ADMIN",
    };
  } catch {
    return null;
  }
}
