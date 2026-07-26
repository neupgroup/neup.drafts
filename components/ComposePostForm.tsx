'use client';

import { useLayoutEffect, useRef, useState } from 'react';
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getEditorHtml(value: string): string {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function getEditorText(element: HTMLDivElement): string {
  const blocks = Array.from(element.children)
    .filter((child) => child instanceof HTMLElement)
    .map((child) => child.textContent?.replace(/\u00a0/g, ' ').trim() ?? '')
    .filter(Boolean);

  if (blocks.length > 0) {
    return blocks.join('\n\n');
  }

  return element.innerText.replace(/\u00a0/g, ' ').trim();
}

function getCaretOffset(element: HTMLElement): number | null {
  const selection = window.getSelection();

  if (
    !selection?.anchorNode ||
    !selection.isCollapsed ||
    !selection.rangeCount ||
    !element.contains(selection.anchorNode)
  ) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const textBeforeCaret = range.cloneRange();
  textBeforeCaret.selectNodeContents(element);
  textBeforeCaret.setEnd(range.endContainer, range.endOffset);

  return textBeforeCaret.toString().length;
}

function getTextLength(element: HTMLElement): number {
  return element.innerText.length;
}

function isCaretAtTextStart(element: HTMLElement): boolean {
  return getCaretOffset(element) === 0;
}

function isCaretAtTextEnd(element: HTMLElement): boolean {
  const caretOffset = getCaretOffset(element);

  return caretOffset !== null && caretOffset >= getTextLength(element);
}

function setCaretPosition(element: HTMLElement, edge: 'start' | 'end') {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(edge === 'start');
  selection.removeAllRanges();
  selection.addRange(range);
}

function getContentBlockFromSelection(editor: HTMLDivElement): HTMLElement {
  const selection = window.getSelection();
  let node = selection?.anchorNode ?? null;

  while (node && node.parentNode !== editor) {
    node = node.parentNode;
  }

  if (node instanceof HTMLElement) {
    return node;
  }

  return editor;
}

function createEditorParagraph(text = ''): HTMLParagraphElement {
  const paragraph = document.createElement('p');

  if (text) {
    paragraph.textContent = text;
  } else {
    paragraph.append(document.createElement('br'));
  }

  return paragraph;
}

function ensureEditorParagraph(editor: HTMLDivElement): HTMLElement {
  const firstBlock = Array.from(editor.children).find(
    (child) => child instanceof HTMLElement
  );

  if (firstBlock instanceof HTMLElement) {
    return firstBlock;
  }

  const text = editor.innerText.replace(/\u00a0/g, ' ').trim();
  const paragraph = createEditorParagraph(text);
  editor.replaceChildren(paragraph);

  return paragraph;
}

export default function ComposePostForm({ article }: ComposePostFormProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const initializedTitleArticleIdRef = useRef<string | null>(null);
  const initializedEditorArticleIdRef = useRef<string | null>(null);
  const [articleId] = useState(() => article?.id ?? createDraftArticleId());
  const [title, setTitle] = useState(article?.title ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isEditing = Boolean(article);
  const slugBase = slugify(title);

  const normalizeTitle = (value: string): string => value.replace(/\s*\r?\n\s*/g, ' ');

  useLayoutEffect(() => {
    if (!contentRef.current || initializedEditorArticleIdRef.current === articleId) {
      return;
    }

    contentRef.current.innerHTML = getEditorHtml(content);
    initializedEditorArticleIdRef.current = articleId;
  }, [articleId, content]);

  useLayoutEffect(() => {
    if (!titleRef.current || initializedTitleArticleIdRef.current === articleId) {
      return;
    }

    titleRef.current.textContent = title;
    initializedTitleArticleIdRef.current = articleId;
  }, [articleId, title]);

  const focusFirstContentBlock = () => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const firstBlock =
      Array.from(contentEditor.children).find((child) => child instanceof HTMLElement) ??
      contentEditor;

    contentEditor.focus();
    setCaretPosition(firstBlock, 'start');
  };

  const focusTitleEnd = () => {
    if (!titleRef.current) {
      return;
    }

    titleRef.current.focus();
    setCaretPosition(titleRef.current, 'end');
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

        <h3
          ref={titleRef}
          role="textbox"
          aria-label="Article title"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          data-placeholder="Title"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              contentRef.current?.focus();
              return;
            }

            if ((e.key === 'ArrowRight' || e.key === 'ArrowDown') && isCaretAtTextEnd(e.currentTarget)) {
              e.preventDefault();
              focusFirstContentBlock();
            }
          }}
          onInput={(e) => setTitle(normalizeTitle(e.currentTarget.innerText))}
          onPaste={(e) => {
            e.preventDefault();
            const text = normalizeTitle(e.clipboardData.getData('text/plain'));
            document.execCommand('insertText', false, text);
          }}
          className="min-h-12 w-full border-0 bg-transparent px-0 font-serif text-4xl font-medium leading-tight tracking-tight text-slate-700 outline-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)]"
        />

        <div
          ref={contentRef}
          role="textbox"
          aria-label="Article content"
          contentEditable
          suppressContentEditableWarning
          data-placeholder="Tell your story..."
          onFocus={(e) => {
            document.execCommand('defaultParagraphSeparator', false, 'p');
            ensureEditorParagraph(e.currentTarget);
          }}
          onInput={(e) => setContent(getEditorText(e.currentTarget))}
          onKeyDown={(e) => {
            document.execCommand('defaultParagraphSeparator', false, 'p');
            const currentBlock = getContentBlockFromSelection(e.currentTarget);

            if (
              (e.key === 'ArrowLeft' || e.key === 'ArrowUp') &&
              isCaretAtTextStart(currentBlock)
            ) {
              const previousBlock = currentBlock.previousElementSibling;
              e.preventDefault();

              if (previousBlock instanceof HTMLElement) {
                setCaretPosition(previousBlock, 'end');
              } else {
                focusTitleEnd();
              }

              return;
            }

            if (
              (e.key === 'ArrowRight' || e.key === 'ArrowDown') &&
              isCaretAtTextEnd(currentBlock)
            ) {
              const nextBlock = currentBlock.nextElementSibling;

              if (nextBlock instanceof HTMLElement) {
                e.preventDefault();
                setCaretPosition(nextBlock, 'start');
              }
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text/plain');
            const paragraphs = text
              .split(/\n{2,}/)
              .map((block) => block.trim())
              .filter(Boolean);

            if (paragraphs.length <= 1) {
              document.execCommand('insertText', false, text);
              return;
            }

            const fragment = document.createDocumentFragment();
            paragraphs.forEach((paragraphText) => {
              fragment.append(createEditorParagraph(paragraphText));
            });

            const selection = window.getSelection();
            const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

            if (!range) {
              e.currentTarget.append(fragment);
              setContent(getEditorText(e.currentTarget));
              return;
            }

            range.deleteContents();
            range.insertNode(fragment);
            setContent(getEditorText(e.currentTarget));
          }}
          className="compose-content-editor min-h-[55vh] w-full border-0 bg-transparent px-0 font-serif text-[20px] font-medium leading-8 text-slate-600 outline-none empty:before:text-slate-300 empty:before:content-[attr(data-placeholder)]"
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
