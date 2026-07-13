// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-guard';
import { globalBlogPosts } from '@/lib/mock-db';

// PUBLIC: Anyone can view a single post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const postId = parseInt(id, 10);

    const post = globalBlogPosts.find((p) => p.id === postId);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// PROTECTED: Only authenticated users can delete
// We dropped the 3rd argument to make 'withAuth' happy!
export const DELETE = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    // Extract the ID straight from the URL path safely (e.g., /api/posts/1)
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1]; 
    
    const postId = parseInt(id, 10);

    // Find the index of the post in your global mock array
    const postIndex = globalBlogPosts.findIndex((p) => p.id === postId);

    if (postIndex === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Remove it from the generic array
    globalBlogPosts.splice(postIndex, 1);

    return NextResponse.json({ 
      message: "Post deleted successfully",
      deletedBy: context.user.username // Proving auth works!
    }, { status: 200 });

  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
});