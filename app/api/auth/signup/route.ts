import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/inapp/lib/prisma';
import { createTokenWithBridge } from '@/inapp/lib/bridge-auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, username } = body;

    // 1. Basic input validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // 2. Check if user already exists (by email)
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // 3. Create the new user in PostgreSQL
    // Note: Hash password with bcrypt before pushing to production!
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        username: cleanUsername,
        password, 
        role: 'user', // Default role
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // 4. Generate auth token via Bridge Auth Service
    const token = await createTokenWithBridge({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
    });

    // 5. Construct response and attach cookie
    const response = NextResponse.json(
      {
        success: true,
        user: newUser,
      },
      { status: 201 }
    );

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));

    console.error('🚨 [SIGNUP_API_CRASH]:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });

    return NextResponse.json(
      { error: 'An unexpected server error occurred.' },
      { status: 500 }
    );
  }
}