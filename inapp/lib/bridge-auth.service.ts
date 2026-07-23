import { prisma } from '@/inapp/lib/prisma';

export interface BridgeUser {
  id: string;
  username: string;
  role: string;
  email: string; // <--- Strictly required! No optional `?`
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
      const dbUser = await prisma.user.findFirst({
        select: {
          id: true,
          username: true,
          role: true,
          email: true,
        },
      });

      // dbUser can be null if DB is empty, so we check if it exists:
      if (dbUser) {
        return dbUser; // TypeScript knows email is 100% a string here!
      }

      console.warn("⚠️ No users found in DB. Seed or create at least 1 user first!");
      return null;
    } catch (error) {
      console.error("❌ Failed to query live DB user during auth:", error);
      return null;
    }
  }

  // 2. REAL AUTH LOOKUP
  try {
    const user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        username: true,
        role: true,
        email: true,
      },
    });

    return user; // Returns BridgeUser | null cleanly
  } catch (error) {
    console.error("Auth token verification error:", error);
    return null;
  }
};