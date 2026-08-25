"use client";

import { useState, SyntheticEvent } from "react";

interface CommentAuthor {
  id: string;
  displayName?: string | null;
  neupId?: string | null;
  status?: string;
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
    displayName: string;
    displayImage: string;
    neupId: string | null;
    type: string;
    createdOn: string;
    status: string;
    moreDetails: unknown;
  } | null;
}

export function CommentSection({
  postId,
  comments,
  currentUser,
}: CommentSectionProps) {
  const [commentText, setCommentText] = useState("");
  const [allComments, setAllComments] = useState<Comment[]>(comments);
  const [error, setError] = useState("");

  // Fixed by switching from FormEvent to SyntheticEvent
  const handlePostComment = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Check if user is logged in before allowing the post
    if (!currentUser || !currentUser.neupId) {
      setError("Could not post comment: are you logged in?");
      return;
    }

    try {
      // 1. Send the data to your API route
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (!response.ok) {
        throw new Error("Failed to save comment on server");
      }

      // 2. Parse the updated comments array returned by your route.ts
      const data = (await response.json()) as {
        success: boolean;
        comments: Comment[];
      };

      // 3. Update the local UI state with the server's data
      setAllComments(data.comments);
      setCommentText("");
    } catch (err) {
      setError((err as Error).message || "Failed to submit comment.");
    }
  };

  const getAuthorName = (comment: Comment) => {
    if (typeof comment.author === "string") return comment.author;
    return comment.author?.neupId || comment.author?.displayName || "Anonymous";
  };

  const getCommentBody = (comment: Comment) => {
    return comment.content || comment.text || "";
  };

  return (
    <div className="border-t border-slate-200 pt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-950">
          Comments
        </h3>
        <span className="font-mono text-xs text-slate-500">
          {allComments.length}
        </span>
      </div>

      {error && (
        <p className="mb-3 text-xs font-medium text-rose-600">{error}</p>
      )}

      {/* COMMENT SUBMISSION FORM */}
      {currentUser ? (
        <form
          onSubmit={handlePostComment}
          className="mb-8 grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          <input
            type="text"
            placeholder={`Comment as @${currentUser.neupId}...`}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="h-11 min-w-0 border border-slate-200 bg-slate-50 px-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-400"
            required
          />
          <button
            type="submit"
            className="h-11 border border-blue-300 px-5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-600 hover:text-white"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mb-8 text-sm italic text-slate-500">
          Please log in to leave a comment.
        </p>
      )}

      {/* COMMENTS FEED LIST */}
      <div className="space-y-4">
        {allComments.length === 0 ? (
          <p className="border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            No comments yet.
          </p>
        ) : (
          allComments.map((comment, index) => (
            <div
              key={`${comment.id}-${index}`}
              className="border border-slate-200 bg-slate-50 p-4 text-sm"
            >
              <p className="font-medium text-rose-600">
                @{getAuthorName(comment)}
              </p>
              <p className="mt-2 leading-6 text-slate-700">
                {getCommentBody(comment)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
