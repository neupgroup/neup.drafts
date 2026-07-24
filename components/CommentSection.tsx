'use client';

import { useState, SyntheticEvent } from 'react';

interface CommentAuthor {
  id: string;
  username?: string | null;
  email?: string | null;
  role?: string;
}

interface Comment {
  id: string;
  content?: string;
  text?: string;
  author?: CommentAuthor | string | null;
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUser?: {
    id: string;
    username: string;
    email: string;
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
      setError((err as Error).message || 'Failed to submit comment.');
    }
  };

  const getAuthorName = (comment: Comment) => {
    if (typeof comment.author === 'string') return comment.author;
    return comment.author?.username || comment.author?.email?.split('@')[0] || 'Anonymous';
  };

  const getCommentBody = (comment: Comment) => {
    return comment.content || comment.text || '';
  };

  return (
    <div className="border-t border-[#a2c7e5]/10 pt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white">
          Comments
        </h3>
        <span className="font-mono text-xs text-[#a2c7e5]/70">
          {allComments.length}
        </span>
      </div>
      
      {error && <p className="mb-3 text-xs font-medium text-[#ff99c9]">{error}</p>}

      {/* COMMENT SUBMISSION FORM */}
      {currentUser ? (
        <form onSubmit={handlePostComment} className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            type="text"
            placeholder={`Comment as @${currentUser.username}...`}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="h-11 min-w-0 border border-[#a2c7e5]/15 bg-[#a2c7e5]/5 px-3 text-sm text-white placeholder:text-[#a2c7e5]/45 outline-none transition-colors focus:border-[#58fcec]/60"
            required
          />
          <button
            type="submit"
            className="h-11 border border-[#58fcec]/40 px-5 text-sm font-bold text-[#58fcec] transition-colors hover:bg-[#58fcec] hover:text-[#131710]"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mb-8 text-sm italic text-[#a2c7e5]/60">Please log in to leave a comment.</p>
      )}

      {/* COMMENTS FEED LIST */}
      <div className="space-y-4">
        {allComments.length === 0 ? (
          <p className="border border-dashed border-[#a2c7e5]/15 px-4 py-5 text-sm text-[#a2c7e5]/60">
            No comments yet.
          </p>
        ) : (
          allComments.map((comment, index) => (
            <div
              key={`${comment.id}-${index}`}
              className="border border-[#a2c7e5]/10 bg-[#a2c7e5]/5 p-4 text-sm"
            >
              <p className="font-bold text-[#ff99c9]">@{getAuthorName(comment)}</p>
              <p className="mt-2 leading-6 text-[#d8d5e8]">{getCommentBody(comment)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
