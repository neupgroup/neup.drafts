'use client';

import { useState, SyntheticEvent } from 'react';

// Created a clean interface for individual comments instead of using 'any'
interface Comment {
  id: number;
  author: string;
  text: string;
}

interface CommentSectionProps {
  postId: number;
  comments: Comment[];
  // Made optional with "?" and allowed to be "null" 
  // so existing code elsewhere doesn't break.
  currentUser?: {
    id: string;
    username: string;
    role: string;
  } | null;
}

export function CommentSection({ postId, comments, currentUser }: CommentSectionProps) {
  const [commentText, setCommentText] = useState('');
  const [allComments, setAllComments] = useState<Comment[]>(comments);
  const [error, setError] = useState('');

  // Fixed by switching from FormEvent to SyntheticEvent
  const handlePostComment = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Check if user is logged in before allowing the post
    if (!currentUser || !currentUser.username) {
      setError('Could not post comment: are you logged in?');
      return;
    }

    try {
      // 1. Send the data to your API route
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (!response.ok) {
        throw new Error('Failed to save comment on server');
      }

      // 2. Parse the updated comments array returned by your route.ts
      const data = (await response.json()) as { success: boolean; comments: Comment[] };

      // 3. Update the local UI state with the server's data
      setAllComments(data.comments);
      setCommentText('');
    } catch (err) {
      setError('Failed to submit comment.');
    }
  };

  return (
    <div className="mt-8 border-t pt-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Comments ({allComments.length})</h3>
      
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      {/* COMMENT SUBMISSION FORM */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder={`Comment as @${currentUser.username}...`}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 mb-6 italic">Please log in to leave a comment.</p>
      )}

      {/* COMMENTS FEED LIST */}
      <div className="space-y-3">
        {allComments.map((c) => (
          <div key={c.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
            <p className="font-semibold text-gray-800">@{c.author}</p>
            <p className="text-gray-600 mt-0.5">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}