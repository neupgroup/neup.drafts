import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { prisma } from '@/inapp/lib/prisma';

function getArticleLookupFromUrl(req: NextRequest): { id: string; slug: string } {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split('/');
  const articleSegment = pathSegments[pathSegments.length - 1];
  const articleSegmentParts = articleSegment.split('-');
  return {
    id: articleSegmentParts[articleSegmentParts.length - 1] || articleSegment,
    slug: articleSegment,
  };
}

// PROTECTED: Only authenticated users can view a single post
export const GET = withAuth(
  async (req: NextRequest) => {
    try {
      const articleLookup = getArticleLookupFromUrl(req);

      // Fetch article from Prisma by CUID String
      const post = await prisma.article.findFirst({
        where: {
          OR: [
            { id: articleLookup.id },
            { slug: articleLookup.slug },
          ],
        },
        include: {
          author: {
            select: { id: true, username: true, role: true }, // Include unique 'id' for profile links!
          },
          comments: {
            include: {
              author: {
                select: { id: true, username: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      return NextResponse.json({ post });
    } catch (error) {
      console.error("Fetch post failed:", error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
  }
);

// PROTECTED: Only authenticated author (or admin) can delete
export const DELETE = withAuth(
  async (req: NextRequest, context: AuthContext) => {
    try {
      const articleLookup = getArticleLookupFromUrl(req);

      // 1. Find the target article first to check ownership
      const post = await prisma.article.findFirst({
        where: {
          OR: [
            { id: articleLookup.id },
            { slug: articleLookup.slug },
          ],
        },
        select: { id: true, authorId: true },
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      // 2. Ownership check using unique user IDs (not display names)
      const isOwner = post.authorId === context.user.id;
      const isAdmin = context.user.role === 'ADMIN';

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You cannot delete this post" },
          { status: 403 }
        );
      }

      // 3. Delete from database
      await prisma.article.delete({
        where: { id: post.id },
      });

      return NextResponse.json(
        {
          message: "Post deleted successfully",
          deletedBy: context.user.username,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Delete failed:", error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
  }
);
