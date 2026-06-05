export interface BridgeUser {
  id: string;
  username: string;
  role: string;
}

export const verifyTokenWithBridge = async (token: string): Promise<BridgeUser | null> => {
  // DUMMY IMPLEMENTATION: Match against our mock secret token string
  if (token === process.env.AUTH_MOCK_TOKEN) {
    return {
      id: 'usr_blog_dev',
      username: 'intern_blogger',
      role: 'author'
    };
  }
  return null;
};