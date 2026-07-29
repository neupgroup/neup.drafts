import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/inapp/lib/prisma';
import { createTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import { Prisma } from '@/inapp/lib/prisma';

function getStoredPassword(details: Prisma.JsonValue): string | null {
  if (!details || typeof details !== 'object' || Array.isArray(details)) {
    return null;
  }

  const password = details.password;
  return typeof password === 'string' ? password : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    const account = await prisma.account.findUnique({
      where: { connectionId: cleanEmail },
      select: {
        id: true,
        connectionId: true,
        displayName: true,
        displayImage: true,
        neupId: true,
        status: true,
        isVerified: true,
        details: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    if (getStoredPassword(account.details) !== password) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const { details, ...safeAccount } = account;
    const token = await createTokenWithBridge(safeAccount);

    const response = NextResponse.json({
      success: true,
      user: safeAccount,
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

    console.error('🚨 [LOGIN_API_CRASH]:', {
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
