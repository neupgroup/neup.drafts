import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/inapp/lib/prisma';
import { createTokenWithBridge } from '@/inapp/lib/bridge-auth.service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawNeupId = body.neupId ?? body.username;
    const { email, password } = body;

    if (!rawNeupId || !email || !password) {
      return NextResponse.json(
        { error: 'Neup ID, email, and password are required.' },
        { status: 400 }
      );
    }

    const cleanConnectionId = email.trim().toLowerCase();
    const cleanNeupId = rawNeupId.trim();

    const existingAccount = await prisma.account.findFirst({
      where: {
        OR: [{ connectionId: cleanConnectionId }, { neupId: cleanNeupId }],
      },
    });

    if (existingAccount) {
      const field = existingAccount.connectionId === cleanConnectionId ? 'Email' : 'Neup ID';
      return NextResponse.json(
        { error: `${field} is already in use.` },
        { status: 400 }
      );
    }

    const newAccount = await prisma.account.create({
      data: {
        connectionId: cleanConnectionId,
        displayName: cleanNeupId,
        neupId: cleanNeupId,
        status: 'ACTIVE',
        isVerified: false,
        details: {
          email: cleanConnectionId,
          password,
        },
      },
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

    const token = await createTokenWithBridge(newAccount);

    const response = NextResponse.json({
      success: true,
      user: newAccount,
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
