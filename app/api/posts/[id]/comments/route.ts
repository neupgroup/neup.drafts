// src/app/api/posts/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/inapp/lib/auth-guard';
import { globalBlogPosts } from '@/inapp/lib/mock-db';

// PROTECTED: Only logged-in users can write a comment
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    // 1. Grab the comment text body from the request
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Comment body cannot be empty' }, { status: 400 });
    }

    // 2. Extract the post ID directly from the request URL string
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    // For a path like /api/posts/1/comments, the ID is 2 slots from the end
    const id = pathSegments[pathSegments.length - 2]; 
    const postId = parseInt(id, 10);

    // 3. Find the exact blog post in your mock array
    const post = globalBlogPosts.find((p) => p.id === postId);

    if (!post) {
      return NextResponse.json({ error: 'Target post not found' }, { status: 404 });
    }

    // 4. Assemble a new generic Comment payload matching your interface structure
    const newComment = {
      id: Date.now(),
      author: context.user.username, // Pulled securely from your auth guard cookie layout
      text
    };

    // 5. Append it straight into that specific post's nested comments array
    post.comments.push(newComment);

    return NextResponse.json({ 
      success: true, 
      message: "Comment saved successfully!",
      comments: post.comments // Send the updated list back to the ComponentSection UI
    }, { status: 201 });

  } catch (error) {
    console.error("Comment submission crashed:", error);
    return NextResponse.json({ error: 'Server processing error' }, { status: 500 });
  }
});