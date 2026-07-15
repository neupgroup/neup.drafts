import { NextRequest, NextResponse } from 'next/server';
import { globalBlogPosts } from '@/inapp/lib/mock-db';

// GET /api/posts/author/[username] -> Fetches all blogs by a specific author
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Filter array to find matches (case-insensitive for safety)
    const authorPosts = globalBlogPosts.filter(
      (post) => post.author.toLowerCase() === username.toLowerCase()
    );

    return NextResponse.json({ posts: authorPosts }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch author posts:", error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}