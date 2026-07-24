'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    setError('');

    try {
      // Hits your existing POST /api/posts endpoint
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to publish post');
      }

      // Success! Send user straight to their newly created article page
      router.push(`/article/${data.post.id}`);
      router.refresh(); 
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
          Title
        </label>
        <input
          type="text"
          required
          placeholder="Give your article a catchy headline..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-11 w-full border border-[#a2c7e5]/20 bg-[#131710] px-3 text-sm text-white outline-none transition-colors placeholder:text-[#a2c7e5]/35 focus:border-[#58fcec]/70"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#58fcec]">
          Body Content
        </label>
        <textarea
          required
          rows={8}
          placeholder="Write your brilliant ideas here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full resize-none border border-[#a2c7e5]/20 bg-[#131710] px-3 py-3 text-sm leading-6 text-white outline-none transition-colors placeholder:text-[#a2c7e5]/35 focus:border-[#58fcec]/70"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full bg-[#58fcec] text-sm font-black text-[#131710] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Publishing...' : 'Publish Article'}
      </button>
    </form>
  );
}
