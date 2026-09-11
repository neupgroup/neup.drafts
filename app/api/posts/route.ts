import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { withAuth, AuthContext } from "@/inapp/lib/auth-guard";
import { prisma } from "@/inapp/lib/prisma";
import { getArticleFeed } from "@/services/articles/articles";
import { PERMISSIONS } from "@/inapp/lib/permissions";

const ARTICLE_ID_PATTERN = /^[a-z0-9]{8,32}$/;

function createArticleId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 12);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildArticleSlug(slug: string, id: string): string {
  const baseSlug = slugify(slug);
  return baseSlug ? `${baseSlug}-${id}` : "";
}

function normalizeArticleContent(content: string): string {
  return content.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

// PUBLIC: Anyone can send a GET request here to read posts feed
export async function GET() {
  try {
    const posts = await getArticleFeed();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json(
      { error: "Failed to read posts feed" },
      { status: 500 },
    );
  }
}

// PROTECTED: Only authenticated users can write a post
export const POST = withAuth(
  PERMISSIONS.ARTICLES_CREATE,
  async (req: NextRequest, context: AuthContext) => {
    try {
      const { title, content, slug, articleId } = await req.json();

      if (typeof title !== "string" || typeof content !== "string") {
        return NextResponse.json(
          { error: "Missing title or content" },
          { status: 400 },
        );
      }

      const nextTitle = title.trim();
      const normalizedContent = normalizeArticleContent(content).trim();

      if (!nextTitle || !normalizedContent) {
        return NextResponse.json(
          { error: "Title and content are required" },
          { status: 400 },
        );
      }

      const id =
        typeof articleId === "string" && ARTICLE_ID_PATTERN.test(articleId)
          ? articleId
          : createArticleId();
      const finalSlug = buildArticleSlug(
        typeof slug === "string" ? slug : nextTitle,
        id,
      );

      if (!finalSlug) {
        return NextResponse.json(
          { error: "Title must contain letters or numbers" },
          { status: 400 },
        );
      }

      // Create the article in PostgreSQL using authorId
      const newPost = await prisma.article.create({
        data: {
          id,
          title: nextTitle,
          content: normalizedContent,
          slug: finalSlug,
          authorId: context.accountId, // Connects directly via unique CUID
        },
        include: {
          author: {
            select: { id: true, displayName: true, neupId: true, status: true },
          },
        },
      });

      return NextResponse.json(
        { message: "Post created!", post: newPost },
        { status: 201 },
      );
    } catch (error) {
      console.error("Post creation failed:", error);
      if (isUniqueConstraintError(error)) {
        return NextResponse.json(
          { error: "Article slug or id already exists" },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: "Invalid payload or server error" },
        { status: 500 },
      );
    }
  },
);
