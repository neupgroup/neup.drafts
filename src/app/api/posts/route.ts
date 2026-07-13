import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-guard';
import { globalBlogPosts } from '@/lib/mock-db';

// PUBLIC: Anyone can send a GET request here to read posts
export async function GET() {
  try {
    // Return the mock array directly. 
    // We reverse it locally or just return it to match the newest-first feed look.
    return NextResponse.json({ posts: globalBlogPosts });
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return NextResponse.json({ error: 'Failed to read posts feed' }, { status: 500 });
  }
}

// PROTECTED: Only authenticated users can write a post
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { title, content } = await req.json();
    
    if (!title || !content) {
      return NextResponse.json({ error: 'Missing title or content' }, { status: 400 });
    }

    // Create a new mock post object that perfectly matches your Post interface
    const newPost = {
      id: Date.now(), // Safe numeric ID generator for mock purposes
      title,
      content,
      author: context.user.username, // Pulled safely from your auth guard
      likes: 0,
      comments: []
    };

    // Push it to the front of the array so new posts show up at the top of the feed
    globalBlogPosts.unshift(newPost);

    return NextResponse.json({ message: 'Post created!', post: newPost }, { status: 201 });
  } catch (error) {
    console.error("Payload parsing failed:", error);
    return NextResponse.json({ error: 'Invalid payload or server error' }, { status: 400 });
  }
});