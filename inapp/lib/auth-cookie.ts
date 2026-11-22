import { cookies } from "next/headers";

// Read the Central Auth session token using the shared cookie name.
export async function getAuthAccountToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_ACCOUNT_COOKIE_NAME)?.value ?? null;
}

// Export the cookie name for request contexts that expose cookies directly.
export const AUTH_ACCOUNT_COOKIE_NAME = "auth";
