import { auth } from "@neup/logica/account/auth";
import { current } from "@neup/logica/account/current";
import { createAccountAccess } from "@neup/logica/account/access";

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
      const [response, accountId] = await Promise.all([
        current.get(authAccountToken),
        current.id.get(authAccountToken),
      ]);
      if (!response.ok || !accountId || !response.body || typeof response.body !== "object") {
        return null;
      }

      const body = response.body as {
        profile?: {
          displayName?: unknown;
          displayImage?: unknown;
          neupid?: unknown;
          status?: unknown;
          type?: unknown;
          createdOn?: unknown;
          moreDetails?: unknown;
        };
      };
      const profile = body.profile ?? {};
      const asString = (value: unknown) => typeof value === "string" ? value : "";

      return {
        id: accountId,
        displayName: asString(profile.displayName),
        displayImage: asString(profile.displayImage),
        neupId: asString(profile.neupid) || null,
        type: asString(profile.type),
        createdOn: asString(profile.createdOn),
        status: asString(profile.status),
        moreDetails: profile.moreDetails ?? {},
      };
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
