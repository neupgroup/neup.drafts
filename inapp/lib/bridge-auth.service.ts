import { prisma } from '@/inapp/lib/prisma';

export interface BridgeUser {
  id: string;
  connectionId: string;
  displayName: string;
  displayImage: string | null;
  neupId: string;
  status: string;
  isVerified: boolean;
}

//Generates the token (currently using user.id)
export const createTokenWithBridge = async (user: BridgeUser): Promise<string> => {
  return user.id;
};

export const verifyTokenWithBridge = async (
  token: string | undefined | null
): Promise<BridgeUser | null> => {
  if (!token) return null;

  const mockSecret = process.env.AUTH_MOCK_TOKEN;

  // 1. DEV / TEST BRIDGE: If using mock token, pull a REAL user from DB
  if (mockSecret && token === mockSecret) {
    try {
      const dbAccount = await prisma.account.findFirst({
        select: {
          id: true,
          connectionId: true,
          displayName: true,
          displayImage: true,
          neupId: true,
          status: true,
          isVerified: true,
        },
      });

      if (dbAccount) {
        return dbAccount;
      }

      console.warn("No accounts found in DB. Seed or create at least 1 account first!");
      return null;
    } catch (error) {
      console.error("❌ Failed to query live DB user during auth:", error);
      return null;
    }
  }

  // 2. REAL AUTH LOOKUP
  try {
    const account = await prisma.account.findUnique({
      where: { id: token },
      select: {
        id: true,
        connectionId: true,
        displayName: true,
        displayImage: true,
        neupId: true,
        status: true,
        isVerified: true,
      },
    });

    return account;
  } catch (error) {
    console.error("Auth token verification error:", error);
    return null;
  }
};
