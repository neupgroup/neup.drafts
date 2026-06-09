import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthContext } from '../../../../lib/auth-guard';
import { blogPosts } from '../route'; // Imports your central array

// 1. Define what a Comment looks like
interface Comment {
  id: number;
  author: string;
  text: string;
}

// 2. Define an "Extended" post type that allows likes and comments
interface InteractivePost {
  id: number;
  title: string;
  content: string;
  author: string;
  likes?: number;       // The '?' means it's optional (might not exist yet)
  comments?: Comment[];  // Optional array of comments
}

export const POST = withAuth(async (req: NextRequest, context: AuthContext) => {
  try {
    const { postId, action, text } = await req.json();
    
    // 3. Find the post and safely tell TypeScript it matches our InteractivePost interface
    const post = blogPosts.find(p => p.id === Number(postId)) as InteractivePost | undefined;

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 4. Handle Likes safely
    if (action === 'like') {
      if (post.likes === undefined) {
        post.likes = 0;
      }
      post.likes += 1;
      return NextResponse.json({ likes: post.likes });
    } 
    
    // 5. Handle Comments safely
    if (action === 'comment') {
      if (!text) return NextResponse.json({ error: 'Comment text required' }, { status: 400 });
      
      if (!post.comments) {
        post.comments = [];
      }
      
      const newComment: Comment = {
        id: Date.now(),
        author: context.user.username,
        text
      };
      
      post.comments.push(newComment);
      return NextResponse.json({ comment: newComment });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(" Interaction API Error:", error);
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
});