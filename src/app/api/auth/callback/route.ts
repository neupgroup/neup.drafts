import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Missing token parameter.' }, { status: 400 });
  }

  const response = NextResponse.json({ message: 'Logged in successfully via callback!' });
  
  // Set the token_from_cookies
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: true,
    path: '/',
  });

  return response;
}