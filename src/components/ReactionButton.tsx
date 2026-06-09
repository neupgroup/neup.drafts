'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReactionButton({ postId, initialLikes }: { postId: number; initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes || 0);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLike = async () => {
    setError('');

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
     setError('⚠️ You must be logged in to like!');
    }
  };

  return (
    <div className="mt-4">
      <button onClick={handleLike} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-medium transition">
        👍 {likes} Likes
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}