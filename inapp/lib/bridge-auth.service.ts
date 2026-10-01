import { auth } from "@/logica/account/auth";
import { current } from "@/logica/account/current";
import { createAccountAccess } from "@/logica/account/access";

const appId = process.env.NEUP_APP_ID;
const appSecret = process.env.NEUP_APP_SECRET;

if (!appId || !appSecret) {
  throw new Error("Central Auth application credentials are not configured.");
}

export const bridgeAuth = {
  async checkAuthentication(authAccountToken?: string | null) {
    return auth.check({
      authAccountToken,
    });
  },

  async getAccountId(authAccountToken: string | null) {
    if (!authAccountToken) {
      return null;
    }

    try {
      return await current.id.get(authAccountToken);
    } catch {
      return null;
    }
  },

  async getCurrentAccount(authAccountToken: string | null) {
    if (!authAccountToken) {
      return null;
    }

    try {
      return await current.get(authAccountToken);
    } catch {
      return null;
    }
  },

  async checkAuthorization(accountId: string, permission: string) {
    if (!accountId) {
      return false;
    }

    const access = createAccountAccess(accountId);

    const result = await access.permission(permission).check(appId, accountId, {
      appSecret,
    });

    return result.ok && result.body.allowed === true;
  },

  async getAccountAccess(accountId: string) {
    if (!accountId) {
      return null;
    }

    const access = createAccountAccess(accountId);

    return access.permission.list({
      appId,
      appSecret,
    });
  },
};
