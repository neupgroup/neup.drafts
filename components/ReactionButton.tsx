'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReactionButtonProps {
  postId: string;
  initialLikes: number;
  currentUser?: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
}

export function ReactionButton({ postId, initialLikes, currentUser }: ReactionButtonProps) {
  const [likes, setLikes] = useState(initialLikes || 0);
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
        className={`inline-flex h-11 items-center justify-center border px-4 text-sm font-bold transition-colors ${
          currentUser 
            ? 'border-[#ff99c9]/40 bg-[#ff99c9]/10 text-[#ff99c9] hover:bg-[#ff99c9] hover:text-[#131710]' 
            : 'cursor-not-allowed border-[#a2c7e5]/10 bg-[#a2c7e5]/5 text-[#a2c7e5]/40'
        }`}
      >
        Like · {likes}
      </button>
      {error && <p className="mt-2 text-xs font-medium text-[#ff99c9]">{error}</p>}
    </div>
  );
}
