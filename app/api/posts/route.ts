import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { prisma } from '@/inapp/lib/prisma';

// Helper to create a URL-friendly slug from title
function slugify(text: string): string {
  const baseSlug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${baseSlug}-${Date.now()}`;
}

// PUBLIC: Anyone can send a GET request here to read posts feed
export async function GET() {
  try {
    const posts = await prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, email: true, role: true }, // Select 'id' for routing
        },
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ error: 'Failed to read posts feed' }, { status: 500 });
  }
}

// PROTECTED: Only authenticated users can write a post
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { title, content } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    // Create the article in PostgreSQL using authorId
    const newPost = await prisma.article.create({
      data: {
        title,
        content,
        slug: slugify(title),
        authorId: context.user.id, // Connects directly via unique CUID
      },
      include: {
        author: {
          select: { id: true, username: true, role: true },
        },
      },
    });

    return NextResponse.json({ message: 'Post created!', post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Post creation failed:", error);
    return NextResponse.json({ error: 'Invalid payload or server error' }, { status: 500 });
  }
});