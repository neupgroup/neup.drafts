import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { globalBlogPosts } from '@/inapp/lib/mock-db';

// POST /api/posts/interact -> Handles liking a post
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { postId, action } = await req.json();

    if (!postId || action !== 'like') {
      return NextResponse.json({ error: 'Missing postId or invalid action' }, { status: 400 });
    }

    // Find the post to interact with
    const post = globalBlogPosts.find((p) => p.id === Number(postId));

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Increment the likes generic counter
    post.likes += 1;

    return NextResponse.json({ 
      message: 'Interaction successful', 
      likes: post.likes 
    }, { status: 200 });

  } catch (error) {
    console.error("Interaction failed:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
});