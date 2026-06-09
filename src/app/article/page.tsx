import { notFound } from 'next/navigation';
import { blogPosts } from '@/app/api/posts/route';
import { ReactionButton } from '@/components/ReactionButton';
import { CommentSection,type Comment } from '@/components/CommentSection';

// 1. Define the exact shape of your Post object
interface BlogPost {
  id: number;
  title: string;
  author: string;
  content: string;
  likes?: number;       // Optional, defaults to a number
  comments?: Comment[];  // Optional, array of strings (or update to match your comment shape)
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  //Find post directly from your backend array file layout

  
  const post = blogPosts.find((p) => p.id === Number(params.id)) as BlogPost | undefined;

  if (!post) {
    notFound();
  }


  return (
    <main className="max-w-2xl mx-auto p-6 mt-6">
      <h1 className="text-3xl font-extrabold text-gray-900">{post.title}</h1>
      <p className="text-xs text-gray-400 mt-1">Written by @{post.author}</p>
      <div className="mt-4 text-gray-700 leading-relaxed text-base">{post.content}</div>

      {/* Here we pass server data right into the interactive client pieces */}
      <ReactionButton postId={post.id} initialLikes={post.likes || 0} />
      <CommentSection postId={post.id} comments={post.comments || []} />
    </main>
  );
}