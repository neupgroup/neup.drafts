import { NextRequest, NextResponse } from "next/server";
import { withAuth, AuthContext } from "@/inapp/lib/auth-guard";
import { prisma } from "@/inapp/lib/prisma";
import { PERMISSIONS } from "@/inapp/lib/permissions";

// PROTECTED: Only logged-in users can write a comment
export const POST = withAuth(
  PERMISSIONS.COMMENTS_CREATE,
  async (req: NextRequest, context: AuthContext) => {
    try {
      // 1. Grab the comment content body from the request
      const { text } = await req.json();

      if (!text || text.trim() === "") {
        return NextResponse.json(
          { error: "Comment body cannot be empty" },
          { status: 400 },
        );
      }

      // 2. Extract the article ID (CUID string) directly from the request URL path
      const url = new URL(req.url);
      const pathSegments = url.pathname.split("/");
      const articleId = pathSegments[pathSegments.length - 2];

      // 3. Save the new comment to PostgreSQL
      await prisma.comment.create({
        data: {
          content: text,
          articleId: articleId,
          authorId: context.accountId, // <--- CHANGED: We now map directly to the unique database ID!
        },
      });

      // 4. Fetch the updated list of comments for this article including author info
      const updatedComments = await prisma.comment.findMany({
        where: { articleId: articleId },
        include: {
          author: {
            select: { id: true, displayName: true, neupId: true, status: true }, // <--- Included 'id' here for safe UI profile routing
          },
        },
        orderBy: { createdAt: "desc" }, // Displays newest comments first
      });

      return NextResponse.json(
        {
          success: true,
          message: "Comment saved successfully!",
          comments: updatedComments, // Sends fresh DB comments back to the UI
        },
        { status: 201 },
      );
    } catch (error) {
      console.error("Comment submission crashed:", error);
      return NextResponse.json(
        { error: "Server processing error" },
        { status: 500 },
      );
    }
  },
);
