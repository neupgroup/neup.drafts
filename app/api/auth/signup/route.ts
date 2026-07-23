import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/inapp/lib/prisma';
import { createTokenWithBridge } from '@/inapp/lib/bridge-auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { username, email, password } = body;

    // 1. Basic Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { error: 'Username, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();

    // 2. Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { username: cleanUsername }],
      },
    });

    if (existingUser) {
      const field = existingUser.email === cleanEmail ? 'Email' : 'Username';
      return NextResponse.json(
        { error: `${field} is already in use.` },
        { status: 400 }
      );
    }

    // 3. Create User in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: password, // Note: Hash with bcrypt before production!
        role: 'user',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    // 4. Generate Auth Token via Bridge Auth Service
    const token = await createTokenWithBridge({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role || 'user',
    });

    // 5. Prepare Response and Set Auth Cookie
    const response = NextResponse.json({
      success: true,
      user: newUser,
    });

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
      { error: 'An unexpected server error occurred during sign up.' },
      { status: 500 }
    );
  }
}