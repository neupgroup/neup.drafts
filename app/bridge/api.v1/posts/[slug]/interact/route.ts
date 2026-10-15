import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/inapp/lib/auth-guard";
import { prisma } from "@neup/core/database/prisma";
import { PERMISSIONS } from "@/inapp/lib/permissions";
import { getArticleBySlugOrId } from "@/services/articles/articles";

// POST /bridge/api.v1/posts/[slug]/interact -> Handles liking/unliking a post
export const POST = withAuth(
  PERMISSIONS.ARTICLES_LIKE,
  async (req: NextRequest, context: AuthContext) => {
    try {
      const { action } = await req.json();
      const url = new URL(req.url);
      const pathSegments = url.pathname.split("/");
      const articleSlug = pathSegments[pathSegments.length - 2];

      if (!articleSlug || action !== "like") {
        return NextResponse.json(
          { error: "Post slug or invalid action is missing" },
          { status: 400 },
        );
      }

      const post = await getArticleBySlugOrId(articleSlug);

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const postId = post.id;

      const accountId = context.accountId;

      // 1. Verify the article exists in the database
      // 2. Check if this specific account already liked the post
      const existingReaction = await prisma.reaction.findFirst({
        where: {
          articleId: postId,
          accountId,
          type: "LIKE",
        },
      });

      if (existingReaction) {
        // User already liked it -> Unlike (delete reaction)
        await prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
      } else {
        await prisma.reaction.create({
          data: {
            type: "LIKE",
            articleId: postId,
            accountId,
          },
        });
      }

      // 3. Get fresh total likes count for this article
      const likesCount = await prisma.reaction.count({
        where: {
          articleId: postId,
          type: "LIKE",
        },
      });

      return NextResponse.json(
        {
          message: existingReaction
            ? "Unliked successfully"
            : "Liked successfully",
          likes: likesCount,
          hasLiked: !existingReaction,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Interaction failed:", error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  },
);
