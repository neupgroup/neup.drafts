'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReactionButtonProps {
  postId: string;
  initialLikes: number;
  currentUser?: {
    id: string;
    displayName: string;
    neupId: string;
    status: string;
  } | null;
}

export function ReactionButton({ postId, initialLikes, currentUser }: ReactionButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLike = async () => {
    setError('');

    // Client-side guard: Prevent hitting the API if the component knows there's no user
    if (!currentUser) {
      setError('You must be logged in to like this article.');
      return;
    }

    const res = await fetch('/api/posts/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'like' }),
    });

    if (res.ok) {
      const data = await res.json();
      setLikes(data.likes);
      router.refresh(); // Tells Next.js to quietly re-sync data from the server
    } else {
      setError('Could not update your reaction.');
    }
  };

  return (
    <div>
      <button 
        onClick={handleLike} 
        className={`inline-flex h-11 items-center justify-center border px-4 text-sm font-medium transition-colors ${
          currentUser 
            ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
            : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
        }`}
      >
        Like : {likes}
        
      </button>
      {error && <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}
