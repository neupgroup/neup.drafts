'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ComposeMediaBlocks, createImageBlock } from './ComposeImageBlocks';

interface ComposeArticle {
  id: string;
  title: string;
  content: string;
  slug: string | null;
}

interface ComposePostFormProps {
  article?: ComposeArticle;
}

type SlashMenuOption = 'image' | 'audio' | 'video' | 'carousel' | 'table';

interface SlashMenuPosition {
  top: number;
  left: number;
}

type VideoProvider = 'youtube' | 'vimeo';

const slashMenuOptions: Array<{
  id: SlashMenuOption;
  label: string;
}> = [
  { id: 'image', label: 'Add an image block' },
  { id: 'audio', label: 'Add an audio block' },
  { id: 'video', label: 'Add a video block' },
  { id: 'carousel', label: 'Add a carousel block' },
  { id: 'table', label: 'Add a table' },
];

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
  if (value.includes('data-editor-block=')) {
    return value;
  }

  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function getEditorText(element: HTMLDivElement): string {
  const htmlContent = element.innerHTML.trim();

  if (htmlContent.includes('data-editor-block=')) {
    return htmlContent;
  }

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
  const node = selection?.anchorNode ?? null;

  return getEditorBlockForNode(editor, node);
}

function getEditorBlockForNode(editor: HTMLDivElement, node: Node | null): HTMLElement {
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

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();

  if (!selection?.rangeCount) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = range.getBoundingClientRect();

  if (rect.width || rect.height) {
    return rect;
  }

  const marker = document.createElement('span');
  marker.append(document.createTextNode('\u200b'));
  range.insertNode(marker);
  const markerRect = marker.getBoundingClientRect();
  marker.remove();

  return markerRect;
}

function getYouTubeEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const pathParts = url.pathname.split('/').filter(Boolean);
      videoId = url.searchParams.get('v') ?? '';

      if (!videoId && ['embed', 'shorts', 'live'].includes(pathParts[0])) {
        videoId = pathParts[1] ?? '';
      }
    }

    return /^[a-zA-Z0-9_-]{6,}$/.test(videoId)
      ? `https://www.youtube.com/embed/${videoId}`
      : null;
  } catch {
    return null;
  }
}

function getVimeoEmbedUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '');
    const pathParts = url.pathname.split('/').filter(Boolean);
    const videoId = pathParts.find((part) => /^\d+$/.test(part)) ?? '';

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function getVideoEmbedUrl(provider: VideoProvider, value: string): string | null {
  return provider === 'youtube'
    ? getYouTubeEmbedUrl(value)
    : getVimeoEmbedUrl(value);
}

function createMediaAltBlock(label: string): HTMLParagraphElement {
  const altBlock = document.createElement('p');

  altBlock.dataset.mediaAlt = 'true';
  altBlock.contentEditable = 'plaintext-only';
  altBlock.textContent = label;

  return altBlock;
}

function createMediaCaption(text = 'Write caption'): HTMLElement {
  const caption = document.createElement('figcaption');

  caption.contentEditable = 'plaintext-only';
  caption.textContent = text;

  return caption;
}

function createTranscriptDetails(): HTMLElement {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  const transcript = document.createElement('p');

  summary.textContent = 'Transcript';
  transcript.contentEditable = 'plaintext-only';
  transcript.textContent = 'Write audio transcription';
  details.append(summary, transcript);

  return details;
}

function createMediaTrack(): HTMLTrackElement {
  const track = document.createElement('track');

  track.kind = 'captions';
  track.label = 'Captions';
  track.srclang = 'en';

  return track;
}

function createMediaFigureBlock(
  editorBlock: 'audio' | 'video' | 'carousel',
  mediaKind: string
): HTMLElement {
  const figure = document.createElement('figure');

  figure.dataset.editorBlock = editorBlock;
  figure.dataset.mediaKind = mediaKind;
  figure.contentEditable = 'false';

  return figure;
}

function createVideoBlock(src: string, provider: VideoProvider | 'local'): HTMLElement {
  const figure = createMediaFigureBlock(
    'video',
    provider === 'local' ? 'video' : provider
  );

  if (provider === 'local') {
    const video = document.createElement('video');

    video.src = src;
    video.controls = true;
    video.append(createMediaTrack());
    figure.append(video);
  } else {
    const iframe = document.createElement('iframe');

    iframe.src = src;
    iframe.title = provider === 'youtube' ? 'YouTube video' : 'Vimeo video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    figure.append(iframe);
  }

  figure.append(
    createMediaAltBlock('Write video alt text'),
    createMediaCaption()
  );

  return figure;
}

function createAudioBlock(src: string): HTMLElement {
  const figure = createMediaFigureBlock('audio', 'audio');
  const audio = document.createElement('audio');

  audio.src = src;
  audio.controls = true;
  audio.append(createMediaTrack());
  figure.append(
    audio,
    createMediaAltBlock('Write audio alt text'),
    createMediaCaption(),
    createTranscriptDetails()
  );

  return figure;
}

function createCarouselBlock(srcValues: string[]): HTMLElement {
  const figure = createMediaFigureBlock('carousel', 'carousel');
  const track = document.createElement('div');

  track.dataset.carouselTrack = 'true';

  srcValues.forEach((src) => {
    const image = document.createElement('img');

    image.src = src;
    image.alt = '';
    image.loading = 'lazy';
    track.append(image);
  });

  figure.append(
    track,
    createMediaAltBlock('Write carousel alt text'),
    createMediaCaption()
  );

  return figure;
}

function createTableBlock(): HTMLElement {
  const wrapper = document.createElement('div');
  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  wrapper.dataset.editorBlock = 'table';

  for (let rowIndex = 0; rowIndex < 3; rowIndex += 1) {
    const row = document.createElement('tr');

    for (let cellIndex = 0; cellIndex < 3; cellIndex += 1) {
      const cell = document.createElement('td');
      cell.append(document.createElement('br'));
      row.append(cell);
    }

    tbody.append(row);
  }

  table.append(tbody);
  wrapper.append(table);

  return wrapper;
}

function getSlashCommandContext(editor: HTMLDivElement): {
  position: SlashMenuPosition;
  query: string;
  range: Range;
} | null {
  const selection = window.getSelection();

  if (
    !selection?.anchorNode ||
    !selection.isCollapsed ||
    !selection.rangeCount ||
    !editor.contains(selection.anchorNode) ||
    selection.anchorNode.nodeType !== Node.TEXT_NODE
  ) {
    return null;
  }

  const textNode = selection.anchorNode;
  const textContent = textNode.textContent ?? '';
  const textBeforeCaret = textContent.slice(0, selection.anchorOffset);
  const slashIndex = textBeforeCaret.lastIndexOf('/');

  if (slashIndex === -1) {
    return null;
  }

  const query = textBeforeCaret.slice(slashIndex + 1);

  if (/\s/.test(query)) {
    return null;
  }

  const rect = getSelectionRect();

  if (!rect) {
    return null;
  }

  const range = document.createRange();
  range.setStart(textNode, slashIndex);
  range.setEnd(textNode, selection.anchorOffset);

  return {
    position: {
      top: rect.bottom + 8,
      left: rect.left,
    },
    query,
    range,
  };
}

export default function ComposePostForm({ article }: ComposePostFormProps) {
  const router = useRouter();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const editorFrameRef = useRef<HTMLDivElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRangeRef = useRef<Range | null>(null);
  const initializedTitleArticleIdRef = useRef<string | null>(null);
  const initializedEditorArticleIdRef = useRef<string | null>(null);
  const [articleId] = useState(() => article?.id ?? createDraftArticleId());
  const [title, setTitle] = useState(article?.title ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slashMenuPosition, setSlashMenuPosition] = useState<SlashMenuPosition | null>(null);
  const [slashMenuQuery, setSlashMenuQuery] = useState('');
  const [activeSlashMenuOptionIndex, setActiveSlashMenuOptionIndex] = useState(0);
  const [videoMenuPosition, setVideoMenuPosition] = useState<SlashMenuPosition | null>(null);
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const isEditing = Boolean(article);
  const slugBase = slugify(title);
  const filteredSlashMenuOptions = slashMenuOptions.filter((option) =>
    option.label.toLowerCase().includes(slashMenuQuery.toLowerCase())
  );

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

  useEffect(() => {
    if (!slashMenuPosition) {
      return;
    }

    const closeSlashMenu = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-slash-menu]')
      ) {
        return;
      }

      slashMenuRangeRef.current = null;
      setSlashMenuPosition(null);
      setSlashMenuQuery('');
    };

    document.addEventListener('mousedown', closeSlashMenu);

    return () => {
      document.removeEventListener('mousedown', closeSlashMenu);
    };
  }, [slashMenuPosition]);

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

  const updateSlashMenuFromSelection = () => {
    const contentEditor = contentRef.current;
    const context = contentEditor ? getSlashCommandContext(contentEditor) : null;

    if (!context) {
      slashMenuRangeRef.current = null;
      setSlashMenuPosition(null);
      setSlashMenuQuery('');
      return;
    }

    slashMenuRangeRef.current = context.range;
    setSlashMenuPosition(context.position);

    if (slashMenuQuery !== context.query) {
      setActiveSlashMenuOptionIndex(0);
    }

    setSlashMenuQuery(context.query);
  };

  const updateSlashMenuAfterCaretMove = () => {
    requestAnimationFrame(() => {
      updateSlashMenuFromSelection();
    });
  };

  const openSlashMenuAfterTextInput = () => {
    requestAnimationFrame(() => {
      updateSlashMenuFromSelection();

      if (contentRef.current) {
        setContent(getEditorText(contentRef.current));
      }
    });
  };

  const syncContentAfterInput = (element: HTMLDivElement) => {
    setContent(getEditorText(element));

    if (slashMenuPosition) {
      requestAnimationFrame(() => {
        updateSlashMenuFromSelection();
      });
    }
  };

  const closeSlashMenu = () => {
    slashMenuRangeRef.current = null;
    setSlashMenuPosition(null);
    setSlashMenuQuery('');
    setActiveSlashMenuOptionIndex(0);
  };

  const closeVideoMenu = () => {
    slashMenuRangeRef.current = null;
    setVideoMenuPosition(null);
    setVideoUrl('');
    setVideoProvider('youtube');
  };

  useEffect(() => {
    if (!videoMenuPosition) {
      return;
    }

    const closeVideoMenuOnOutsideClick = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-video-menu]')
      ) {
        return;
      }

      closeVideoMenu();
    };

    document.addEventListener('mousedown', closeVideoMenuOnOutsideClick);

    return () => {
      document.removeEventListener('mousedown', closeVideoMenuOnOutsideClick);
    };
  }, [videoMenuPosition]);

  useEffect(() => {
    if (!videoMenuPosition) {
      return;
    }

    const closeVideoMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeVideoMenu();
      }
    };

    document.addEventListener('keydown', closeVideoMenuOnEscape);

    return () => {
      document.removeEventListener('keydown', closeVideoMenuOnEscape);
    };
  }, [videoMenuPosition]);

  const moveActiveSlashMenuOption = (direction: 1 | -1) => {
    setActiveSlashMenuOptionIndex((currentIndex) => {
      if (filteredSlashMenuOptions.length === 0) {
        return 0;
      }

      return (
        currentIndex +
        direction +
        filteredSlashMenuOptions.length
      ) % filteredSlashMenuOptions.length;
    });
  };

  const insertEditorBlock = (block: HTMLElement) => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const selection = window.getSelection();
    const range = slashMenuRangeRef.current;
    const commandBlock = range
      ? getEditorBlockForNode(contentEditor, range.startContainer)
      : null;
    const shouldReplaceCommandBlock =
      commandBlock &&
      commandBlock !== contentEditor &&
      commandBlock.textContent?.trim() === range?.toString().trim();

    contentEditor.focus();

    if (shouldReplaceCommandBlock) {
      commandBlock.replaceWith(block);
    } else if (range) {
      selection?.removeAllRanges();
      selection?.addRange(range);
      range.deleteContents();
      range.insertNode(block);
    } else {
      contentEditor.append(block);
    }

    const paragraph = createEditorParagraph();
    block.after(paragraph);
    setCaretPosition(paragraph, 'start');
    setContent(getEditorText(contentEditor));
    closeSlashMenu();
  };

  const handleSlashMenuOption = (option: SlashMenuOption) => {
    if (option === 'image') {
      insertEditorBlock(createImageBlock());
      return;
    }

    if (option === 'audio') {
      const src = window.prompt('Audio URL');

      if (src?.trim()) {
        insertEditorBlock(createAudioBlock(src.trim()));
      }

      return;
    }

    if (option === 'video') {
      setVideoMenuPosition(slashMenuPosition ?? { top: 0, left: 0 });
      setSlashMenuPosition(null);
      setSlashMenuQuery('');
      setActiveSlashMenuOptionIndex(0);
      return;
    }

    if (option === 'carousel') {
      const value = window.prompt('Image URLs, separated by commas');
      const srcValues = value
        ?.split(',')
        .map((src) => src.trim())
        .filter(Boolean) ?? [];

      if (srcValues.length > 0) {
        insertEditorBlock(createCarouselBlock(srcValues));
      }

      return;
    }

    insertEditorBlock(createTableBlock());
  };

  const handleVideoEmbedSubmit = () => {
    const embedUrl = getVideoEmbedUrl(videoProvider, videoUrl);

    if (!embedUrl) {
      setError(
        videoProvider === 'youtube'
          ? 'Enter a valid YouTube URL.'
          : 'Enter a valid Vimeo URL.'
      );
      return;
    }

    setError('');
    insertEditorBlock(createVideoBlock(embedUrl, videoProvider));
    closeVideoMenu();
  };

  const handleLocalVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';

      if (!src) {
        return;
      }

      setError('');
      insertEditorBlock(createVideoBlock(src, 'local'));
      closeVideoMenu();
    };

    reader.readAsDataURL(file);
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

        <div ref={editorFrameRef} className="relative">
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
            onInput={(e) => syncContentAfterInput(e.currentTarget)}
            onKeyDown={(e) => {
              document.execCommand('defaultParagraphSeparator', false, 'p');

            if (e.key === 'Escape' && slashMenuPosition) {
              e.preventDefault();
              closeSlashMenu();
              return;
            }

            if (slashMenuPosition && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault();
              moveActiveSlashMenuOption(e.key === 'ArrowDown' ? 1 : -1);
              return;
            }

            if (slashMenuPosition && e.key === 'Enter') {
              e.preventDefault();
              const activeOption = filteredSlashMenuOptions[activeSlashMenuOptionIndex];

              if (activeOption) {
                handleSlashMenuOption(activeOption.id);
              } else {
                closeSlashMenu();
              }

              return;
            }

            if (slashMenuPosition && e.key === 'Tab') {
              e.preventDefault();
              closeSlashMenu();
              return;
            }

            if (slashMenuPosition && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
              const commandContext = getSlashCommandContext(e.currentTarget);
              const commandRange = commandContext?.range;
              const commandTextNode = commandRange?.startContainer;

              if (
                e.key === 'ArrowLeft' &&
                commandRange &&
                commandRange.endOffset <= commandRange.startOffset + 1
              ) {
                closeSlashMenu();
                return;
              }

              if (
                e.key === 'ArrowRight' &&
                commandRange &&
                commandTextNode &&
                commandTextNode.nodeType === Node.TEXT_NODE &&
                !(commandTextNode.textContent ?? '')[commandRange.endOffset]
              ) {
                e.preventDefault();
                closeSlashMenu();
                return;
              }

              updateSlashMenuAfterCaretMove();
              return;
            }

            if (e.key === '/') {
              openSlashMenuAfterTextInput();
              return;
            }

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

          <ComposeMediaBlocks
            contentRef={contentRef}
            editorFrameRef={editorFrameRef}
            getContent={getEditorText}
            onContentChange={setContent}
          />
        </div>

        {slashMenuPosition && (
          <div
            data-slash-menu
            style={{
              top: slashMenuPosition.top,
              left: slashMenuPosition.left,
            }}
            className="fixed z-50 w-56 border border-slate-200 bg-white p-1 shadow-lg"
          >
            {filteredSlashMenuOptions.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSlashMenuOption(option.id)}
                className={`block w-full rounded px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 ${
                  index === activeSlashMenuOptionIndex ? 'bg-slate-100' : ''
                }`}
              >
                {option.label}
              </button>
            ))}

            {filteredSlashMenuOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-500">
                No blocks found
              </div>
            )}
          </div>
        )}

        {videoMenuPosition && (
          <div
            data-video-menu
            style={{
              top: videoMenuPosition.top,
              left: videoMenuPosition.left,
            }}
            className="fixed z-50 w-80 border border-slate-200 bg-white p-3 shadow-lg"
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setVideoProvider('youtube')}
                className={`h-9 rounded border px-3 text-sm font-medium ${
                  videoProvider === 'youtube'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                YouTube
              </button>

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setVideoProvider('vimeo')}
                className={`h-9 rounded border px-3 text-sm font-medium ${
                  videoProvider === 'vimeo'
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Vimeo
              </button>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleVideoEmbedSubmit();
                  }
                }}
                placeholder={
                  videoProvider === 'youtube'
                    ? 'Paste YouTube URL'
                    : 'Paste Vimeo URL'
                }
                className="min-w-0 flex-1 border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-blue-300"
              />

              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleVideoEmbedSubmit}
                className="h-9 rounded bg-blue-600 px-3 text-sm font-medium text-white"
              >
                Add
              </button>
            </div>

            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => videoFileInputRef.current?.click()}
              className="mt-3 h-9 w-full rounded border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Add local video
            </button>
          </div>
        )}
      </div>

      <input
        ref={videoFileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleLocalVideoChange}
      />

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
