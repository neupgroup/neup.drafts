import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { prisma } from '@/inapp/lib/prisma';

const ARTICLE_ID_PATTERN = /^[a-z0-9]{8,32}$/;

function createArticleId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 12);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildArticleSlug(slug: string, id: string): string {
  const baseSlug = slugify(slug);
  return baseSlug ? `${baseSlug}-${id}` : '';
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
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
    const { title, content, slug, articleId } = await req.json();

    if (!title || !content || !slug) {
      return NextResponse.json({ error: 'Missing title, slug, or content' }, { status: 400 });
    }

    const id =
      typeof articleId === 'string' && ARTICLE_ID_PATTERN.test(articleId)
        ? articleId
        : createArticleId();
    const finalSlug = buildArticleSlug(slug, id);

    if (!finalSlug) {
      return NextResponse.json({ error: 'Slug must contain letters or numbers' }, { status: 400 });
    }

    // Create the article in PostgreSQL using authorId
    const newPost = await prisma.article.create({
      data: {
        id,
        title,
        content,
        slug: finalSlug,
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
    if (isUniqueConstraintError(error)) {
      return NextResponse.json({ error: 'Article slug or id already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Invalid payload or server error' }, { status: 500 });
  }
});
