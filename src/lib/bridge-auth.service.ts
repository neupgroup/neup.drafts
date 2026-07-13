export interface BridgeUser {
  id: string;
  username: string;
  role: string;
}

export const verifyTokenWithBridge = async (token: string | undefined | null): Promise<BridgeUser | null> => {
  // 1. If no token was provided, reject immediately 
  if (!token) {
    return null;
  }

  // 2. Ensure the environment variable is actually set up
  const mockSecret = process.env.AUTH_MOCK_TOKEN ;
  if (!mockSecret) {
    console.warn("⚠️ AUTH_MOCK_TOKEN is not defined in your environment variables!");
    return null;
  }

  // 3. Now it is completely safe to compare the strict strings
  if (token === mockSecret) {
    return {
      id: 'usr_blog_dev',
      username: 'intern_blogger',
      role: 'author'
    };
  }
  
  return null;
};