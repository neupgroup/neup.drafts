// app/api/posts/interact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { prisma } from '@/inapp/lib/prisma';

// POST /api/posts/interact -> Handles liking/unliking a post
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { postId, action } = await req.json();

    if (!postId || action !== 'like') {
      return NextResponse.json({ error: 'Missing postId or invalid action' }, { status: 400 });
    }

    const userId = context.user.id; // Unique DB User ID

    // 1. Verify the article exists in the database
    const article = await prisma.article.findUnique({
      where: { id: postId },
    });

    if (!article) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 2. Check if this specific user already liked the post
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        articleId: postId,
        userId: userId,
        type: 'LIKE',
      },
    });

    if (existingReaction) {
      // User already liked it -> Unlike (delete reaction)
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });
    } else {
      // User hasn't liked it yet -> Create new reaction using userId CUID
      await prisma.reaction.create({
        data: {
          type: 'LIKE',
          articleId: postId,
          userId: userId,
        },
      });
    }

    // 3. Get fresh total likes count for this article
    const likesCount = await prisma.reaction.count({
      where: {
        articleId: postId,
        type: 'LIKE',
      },
    });

    return NextResponse.json({ 
      message: existingReaction ? 'Unliked successfully' : 'Liked successfully', 
      likes: likesCount,
      hasLiked: !existingReaction,
    }, { status: 200 });

  } catch (error) {
    console.error("Interaction failed:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});