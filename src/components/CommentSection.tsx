'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 1. Define exactly what a Comment object contains
export interface Comment {
  id: number | string;
  author: string;
  text: string;
}

// 2. Update the component props to use the Comment interface instead of any[]
export function CommentSection({ postId, comments = [] }: { postId: number; comments: Comment[] }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError('');

    const res = await fetch('/api/posts/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, action: 'comment', text }),
    });

    if (res.ok) {
      setText('');
      router.refresh(); 
    } else {
      setError('❌ Could not post comment. Are you logged in?');
    }
  };

  return (
    <div className="mt-8 border-t pt-4">
      <h3 className="font-bold text-lg text-gray-800 mb-2">Comments</h3>
      <form onSubmit={handleSubmit} className="mb-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a comment..."
          className="w-full p-2 border border-gray-300 rounded text-black"
          rows={3}
        />
        <button type="submit" className="mt-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm">
          Post Comment
        </button>
      </form>
      {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
      <div className="space-y-2">
        {/* 3. Remove 'any' from the map loop argument */}
        {comments.map((c) => (
          <div key={c.id} className="p-2 bg-gray-50 rounded border text-sm">
            <span className="font-bold text-blue-600 block">@{c.author}</span>
            <span className="text-gray-700">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}