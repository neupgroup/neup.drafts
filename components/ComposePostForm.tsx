'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ComposeArticle {
  id: string;
  title: string;
  content: string;
  slug: string | null;
}

interface ComposePostFormProps {
  article?: ComposeArticle;
}

function createDraftArticleId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 12);
  }

  return Math.random().toString(36).slice(2, 14);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getArticlePath(article: ComposeArticle): string {
  if (!article.slug) {
    return `/article/${article.id}`;
  }

  return `/article/${article.slug.endsWith(`-${article.id}`) ? article.slug : `${article.slug}-${article.id}`}`;
}

export default function ComposePostForm({ article }: ComposePostFormProps) {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [articleId] = useState(() => article?.id ?? createDraftArticleId());
  const [title, setTitle] = useState(article?.title ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(article);
  const slugBase = slugify(title);

  const resizeTextarea = (element: HTMLTextAreaElement) => {
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  };

  const normalizeTitle = (value: string): string => value.replace(/\s*\r?\n\s*/g, ' ');

  const insertContentText = (element: HTMLTextAreaElement, value: string) => {
    const selectionStart = element.selectionStart;
    const selectionEnd = element.selectionEnd;
    const nextContent =
      content.slice(0, selectionStart) + value + content.slice(selectionEnd);
    const nextCursorPosition = selectionStart + value.length;

    setContent(nextContent);

    requestAnimationFrame(() => {
      element.selectionStart = nextCursorPosition;
      element.selectionEnd = nextCursorPosition;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    if (!isEditing && !slugBase) {
      setError('Title must contain letters or numbers.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(isEditing ? `/api/posts/${articleId}` : '/api/posts', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { title, content }
            : { title, slug: slugBase, content, articleId }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEditing ? 'Failed to update article' : 'Failed to publish post'));
      }

      router.push(getArticlePath(data.post));
      router.refresh();
    } catch (err) {
      setError((err as Error).message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {isEditing && (
          <span className="inline-flex h-7 items-center border border-blue-200 bg-blue-50 px-3 font-mono text-xs font-medium text-blue-600">
            editing.
          </span>
        )}

        <textarea
          required
          rows={1}
          placeholder="Title"
          value={title}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              contentRef.current?.focus();
            }
          }}
          onChange={(e) => {
            setTitle(normalizeTitle(e.target.value));
            resizeTextarea(e.target);
          }}
          className="w-full resize-none overflow-hidden border-0 bg-transparent px-0 font-serif text-4xl font-medium leading-tight tracking-tight text-slate-700 outline-none placeholder:text-slate-300"
        />

        <textarea
          ref={contentRef}
          required
          rows={isEditing ? 18 : 12}
          placeholder="Tell your story..."
          value={content}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              insertContentText(e.currentTarget, '\n\n');
            }
          }}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[55vh] w-full resize-none border-0 bg-transparent px-0 font-serif text-[20px] font-medium leading-8 text-slate-600 outline-none placeholder:text-slate-300"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="h-9 rounded-full bg-blue-600 px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? (isEditing ? 'Saving...' : 'Publishing...') : (isEditing ? 'Save Changes' : 'Publish')}
        </button>

        {isEditing && article && (
          <button
            type="button"
            onClick={() => router.push(getArticlePath(article))}
            className="h-9 rounded-full border border-slate-300 px-5 text-sm font-medium text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
