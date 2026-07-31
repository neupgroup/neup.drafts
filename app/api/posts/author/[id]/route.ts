import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/inapp/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: authorId } = await params;

    const authorPosts = await prisma.article.findMany({
      where: {
        authorId: authorId,
      },
      include: {
        author: {
          select: { id: true, displayName: true, neupId: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts: authorPosts }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch author posts:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
