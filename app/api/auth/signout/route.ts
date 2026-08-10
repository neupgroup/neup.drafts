import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  
  // Clear the authentication cookie
  cookieStore.delete('auth_token');

  // Redirect user to the login page after clearing cookie
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const loginUrl = new URL(`${basePath}/login`, request.url);
  return NextResponse.redirect(loginUrl);
}