import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/inapp/lib/auth-guard";
import { prisma } from "@/inapp/lib/prisma";
import {
  getArticleBySlugOrId,
  getArticleLookupFromSlug,
  getArticleOwnershipBySlugOrId,
} from "@/services/articles/articles";

function getArticleLookupFromUrl(req: NextRequest): {
  id: string;
  slug: string;
} {
  const url = new URL(req.url);
  const pathSegments = url.pathname.split("/");
  return getArticleLookupFromSlug(pathSegments[pathSegments.length - 1] || "");
}

function normalizeArticleContent(content: string): string {
  return content.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");
}

// PROTECTED: Only authenticated users can view a single post
export const GET = withAuth(async (req: NextRequest) => {
  try {
    const articleLookup = getArticleLookupFromUrl(req);

    const post = await getArticleBySlugOrId(articleLookup.slug);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Fetch post failed:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
});

// PROTECTED: Only authenticated author (or admin) can update
export const PATCH = withAuth(
  async (req: NextRequest, context: AuthContext) => {
    try {
      const articleLookup = getArticleLookupFromUrl(req);
      let body: unknown;

      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON payload" },
          { status: 400 },
        );
      }

      const { title, content } =
        typeof body === "object" && body !== null
          ? (body as { title?: unknown; content?: unknown })
          : {};

      if (typeof title !== "string" || typeof content !== "string") {
        return NextResponse.json(
          { error: "Missing title or content" },
          { status: 400 },
        );
      }

      const nextTitle = title.trim();
      const nextContent = normalizeArticleContent(content).trim();

      if (!nextTitle || !nextContent) {
        return NextResponse.json(
          { error: "Title and content are required" },
          { status: 400 },
        );
      }

      const post = await getArticleOwnershipBySlugOrId(articleLookup.slug);

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const isOwner = post.authorId === context.accountId;
      const isAdmin = context.user.status === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You cannot edit this post" },
          { status: 403 },
        );
      }

      const updatedPost = await prisma.article.update({
        where: { id: post.id },
        data: {
          title: nextTitle,
          content: nextContent,
        },
      });

      return NextResponse.json(
        {
          message: "Post updated successfully",
          post: updatedPost,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Update failed:", error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
  },
);

// PROTECTED: Only authenticated author (or admin) can delete
export const DELETE = withAuth(
  async (req: NextRequest, context: AuthContext) => {
    try {
      const articleLookup = getArticleLookupFromUrl(req);

      // 1. Find the target article first to check ownership
      const post = await getArticleOwnershipBySlugOrId(articleLookup.slug);

      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      // 2. Ownership check using unique user IDs (not display names)
      const isOwner = post.authorId === context.accountId;
      const isAdmin = context.user.status === "ADMIN";

      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You cannot delete this post" },
          { status: 403 },
        );
      }

      // 3. Delete from database
      await prisma.article.delete({
        where: { id: post.id },
      });

      return NextResponse.json(
        {
          message: "Post deleted successfully",
          deletedBy: context.accountId,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Delete failed:", error);
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
  },
);
