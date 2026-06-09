import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '../../../lib/auth-guard';

export const blogPosts = [
  { id: 1, title: 'My First Post', content: 'Hello World', author: 'intern_blogger' }
];

// PUBLIC: Anyone can send a GET request here to read posts
export async function GET() {
  return NextResponse.json({ posts: blogPosts });
}

// PROTECTED: Only users with the dummy token can send a POST request to write a post
export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { title, content } = await req.json();
    const newPost = {
      id: blogPosts.length + 1,
      title,
      content,
      author: context.user.username
    };
    blogPosts.push(newPost);
    return NextResponse.json({ message: 'Post created!', post: newPost }, { status: 201 });
  } catch (error) {
    // Log the real error to your VS Code terminal so you can see what went wrong
    console.error("Payload parsing failed:", error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
});