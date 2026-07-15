import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyTokenWithBridge } from '@/inapp/lib/bridge-auth.service';
import {ReactionButton} from '@/components/ReactionButton';
import {CommentSection} from '@/components/CommentSection';

// 1. New helper function to fetch data from your fresh API route
async function getPostFromApi(id: string) {
  try {
    // We use an absolute URL or a relative one depending on your environment.
    // For local Next.js server components fetching their own internal routes:
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/posts/${id}`, {
      cache: 'no-store', // Ensures you always get the freshest likes/comments
    });

    if (!res.ok) return null;
    
    const data = await res.json();
    return data.post;
  } catch (error) {
    console.error("API fetch failed for article:", error);
    return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Native Server-side Auth verification
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const user = token ? await verifyTokenWithBridge(token) : null;

  if (!user) {
    redirect('/unauthorized'); // Kicks them out if not logged in
  }

  // 2. Swapped out the old inline array .find() for the API call!
  const post = await getPostFromApi(id);

  // Fallback if the API returns a 404 (post not found)
  if (!post) {
    return (
      <main className="p-8 text-center mt-12">
        <h1 className="text-2xl font-bold text-gray-800">404 - Article Not Found</h1>
        <p className="text-gray-500 mt-2">The article you are looking for does not exist.</p>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6 mt-12 bg-white border rounded-xl shadow-sm">
      {/* ARTICLE CONTENT */}
      <article className="space-y-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {post.title}
        </h1>
        <p className="text-xs text-gray-400">
          By <span className="font-semibold text-gray-600">@{post.author}</span>
        </p>
        <hr className="border-gray-100" />
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>
      </article>

      <hr className="border-gray-100" />

      {/* INTERACTION ZONE */}
      <div className="flex flex-col gap-6">
        {/* 1. Pass currentUser here to disable the guard block */}
        <ReactionButton 
        postId={post.id} 
        initialLikes={post.likes} 
        currentUser={user} 
        />
  
      {/* 2. Pass currentUser here to display the input form */}
      <CommentSection 
      postId={post.id} 
      comments={post.comments} 
      currentUser={user} 
      />
      </div>
    </main>
  );
}