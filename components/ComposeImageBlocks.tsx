'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface ComposeMediaBlocksProps {
  contentRef: RefObject<HTMLDivElement | null>;
  editorFrameRef: RefObject<HTMLDivElement | null>;
  getContent: (element: HTMLDivElement) => string;
  onContentChange: (content: string) => void;
}

interface MediaBlockControlsPosition {
  top: number;
  left: number;
}

interface MediaTextActionsPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface MediaBlockControl {
  block: HTMLElement;
  altText: string;
  caption: string;
  textActionsPosition: MediaTextActionsPosition | null;
  controlsPosition: MediaBlockControlsPosition;
}

type MediaTextEditMode = 'alt' | 'caption';
type MediaBlockType = 'image' | 'audio' | 'video' | 'carousel';

const textEditableBlockSelector = [
  '[data-editor-block="image"]',
  '[data-editor-block="audio"]',
  '[data-editor-block="video"]',
  '[data-editor-block="carousel"]',
].join(',');

interface ComposeMediaBlockControlsProps {
  position: MediaBlockControlsPosition;
  onChange: () => void;
  onRemove: () => void;
}

interface ComposeMediaTextActionsProps {
  activeMode: MediaTextEditMode | null;
  hasAltText: boolean;
  hasCaption: boolean;
  isActive: boolean;
  position: MediaTextActionsPosition;
  onStartEditing: (mode: MediaTextEditMode) => void;
}

interface ComposeMediaTextEditorProps {
  block: HTMLElement;
  mode: MediaTextEditMode;
  value: string;
  onCommit: (value: string) => void;
  onDismiss: (value: string) => void;
}

interface MediaTextDraftState {
  defaultValue: string;
  draftValue: string;
}

type MediaTextDrafts = Partial<Record<MediaTextEditMode, MediaTextDraftState>>;

interface EditingMediaText {
  block: HTMLElement;
  mode: MediaTextEditMode;
  value: string;
}

function getCaretTextOffset(element: HTMLElement): number | null {
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

function setCaretToTextEnd(element: HTMLElement) {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(element);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCollapsedRangeRect(range: Range): DOMRect | null {
  const rangeRect = range.getClientRects()[0];

  if (rangeRect) {
    return rangeRect;
  }

  const selection = window.getSelection();
  const originalRange = selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  const marker = document.createElement('span');

  marker.textContent = '\u200b';
  range.cloneRange().insertNode(marker);

  const markerParent = marker.parentNode;
  const markerRect = marker.getBoundingClientRect();

  marker.remove();
  markerParent?.normalize();

  if (originalRange && selection) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }

  return markerRect;
}

function isCaretOnLastTextLine(element: HTMLElement): boolean {
  const selection = window.getSelection();

  if (
    !selection?.anchorNode ||
    !selection.isCollapsed ||
    !selection.rangeCount ||
    !element.contains(selection.anchorNode)
  ) {
    return true;
  }

  const caretRange = selection.getRangeAt(0);
  const endRange = document.createRange();

  endRange.selectNodeContents(element);
  endRange.collapse(false);

  const caretRect = getCollapsedRangeRect(caretRange);
  const endRect = getCollapsedRangeRect(endRange);

  if (!caretRect || !endRect) {
    const caretOffset = getCaretTextOffset(element);

    return caretOffset === null || caretOffset >= element.innerText.length;
  }

  return caretRect.bottom >= endRect.top - 2;
}

function handleMediaTextEditorArrowDown(
  event: KeyboardEvent,
  editor: HTMLElement
): boolean {
  event.stopPropagation();

  if (!isCaretOnLastTextLine(editor)) {
    return false;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  setCaretToTextEnd(editor);

  return true;
}

export function createImageBlock(src?: string): HTMLElement {
  const figure = document.createElement('figure');
  const button = document.createElement('button');

  figure.dataset.editorBlock = 'image';
  figure.dataset.mediaKind = 'image';
  figure.contentEditable = 'false';
  button.type = 'button';
  button.dataset.imagePicker = 'true';
  button.innerHTML = src
    ? '<span>Change image</span>'
    : '<span class="compose-image-picker-icon">+</span><span class="compose-image-picker-title">Add image</span><span class="compose-image-picker-help">Click to choose a file from your device</span>';
  figure.append(button);

  if (src) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = '';
    image.loading = 'lazy';
    figure.prepend(image);
  }

  return figure;
}

function getMediaBlockControlsPosition(
  block: HTMLElement,
  container: HTMLElement
): MediaBlockControlsPosition | null {
  const rect = block.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (!block.isConnected || rect.bottom <= 0 || rect.top >= window.innerHeight) {
    return null;
  }

  const left = rect.right - containerRect.left - 84;
  const maxLeft = Math.max(8, containerRect.width - 80);

  return {
    top: Math.max(8, rect.top - containerRect.top + 12),
    left: Math.min(Math.max(8, left), maxLeft),
  };
}

function getMediaTextActionsPosition(
  block: HTMLElement,
  container: HTMLElement
): MediaTextActionsPosition | null {
  const media = block.querySelector('[data-carousel-track], img, audio, video, iframe');
  const rect = media?.getBoundingClientRect() ?? block.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (
    !block.isConnected ||
    !media ||
    rect.bottom <= 0 ||
    rect.top >= window.innerHeight
  ) {
    return null;
  }

  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, window.innerHeight);
  const height = Math.min(112, Math.max(0, visibleBottom - visibleTop));

  if (height < 48) {
    return null;
  }

  return {
    top: visibleBottom - containerRect.top - height,
    left: rect.left - containerRect.left,
    width: rect.width,
    height,
  };
}

function ComposeMediaBlockControls({
  position,
  onChange,
  onRemove,
}: ComposeMediaBlockControlsProps) {
  return (
    <div
      data-image-block-controls
      style={{
        top: position.top,
        left: position.left,
      }}
      className="absolute z-10"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Change image"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onChange}
          className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-400 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.25"
          >
            <path d="M21 12a9 9 0 0 1-15.2 6.5" />
            <path d="M3 12a9 9 0 0 1 15.2-6.5" />
            <path d="M7 18H5.2a1 1 0 0 0-1 1V21" />
            <path d="M17 6h1.8a1 1 0 0 0 1-1V3" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Remove image block"
          onMouseDown={(event) => event.preventDefault()}
          onClick={onRemove}
          className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white/95 text-xl leading-none text-slate-400 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function ComposeMediaTextActions({
  activeMode,
  hasAltText,
  hasCaption,
  isActive,
  position,
  onStartEditing,
}: ComposeMediaTextActionsProps) {
  const overlayClassName = [
    'group absolute z-[9] flex items-end justify-center bg-gradient-to-t from-slate-950/65 to-transparent p-4 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100',
    isActive ? 'opacity-100' : 'opacity-0',
  ].join(' ');
  const actionClassName = [
    'flex items-center gap-5 font-serif text-sm font-semibold text-white shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100',
    isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
  ].join(' ');

  return (
    <div
      data-media-text-actions
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
      }}
      className={overlayClassName}
    >
      <div className={actionClassName}>
        <a
          href="#"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            onStartEditing('alt');
          }}
          className="compose-media-action-link"
          data-active={activeMode === 'alt' ? 'true' : undefined}
        >
          {activeMode === 'alt' ? 'Save alt text' : hasAltText ? 'Edit alt text' : 'Add alt text'}
        </a>

        <a
          href="#"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            onStartEditing('caption');
          }}
          className="compose-media-action-link"
          data-active={activeMode === 'caption' ? 'true' : undefined}
        >
          {activeMode === 'caption' ? 'Save caption' : hasCaption ? 'Edit caption' : 'Add caption'}
        </a>
      </div>
    </div>
  );
}

function getMediaBlockType(block: HTMLElement): MediaBlockType | null {
  const blockType = block.dataset.editorBlock;

  return (
    blockType === 'image' ||
    blockType === 'audio' ||
    blockType === 'video' ||
    blockType === 'carousel'
  )
    ? blockType
    : null;
}

function ComposeMediaTextEditor({
  block,
  mode,
  value,
  onCommit,
  onDismiss,
}: ComposeMediaTextEditorProps) {
  const placeholder = mode === 'alt' ? 'Write alt text here' : 'Write caption here';
  const onCommitRef = useRef(onCommit);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onDismissRef.current = onDismiss;
  }, [onCommit, onDismiss]);

  useEffect(() => {
    const editor = document.createElement('p');
    let didFinish = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        didFinish = true;
        editor.blur();
        onCommitRef.current((event.currentTarget as HTMLElement).innerText);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        didFinish = true;
        editor.blur();
        onDismissRef.current((event.currentTarget as HTMLElement).innerText);
      }

      if (event.key === 'ArrowDown') {
        handleMediaTextEditorArrowDown(event, editor);
      }
    };
    const handleMouseDown = (event: MouseEvent) => {
      event.stopPropagation();
    };
    const handleInput = (event: Event) => {
      event.stopPropagation();
    };
    const handleBlur = (event: FocusEvent) => {
      if (didFinish) {
        return;
      }

      didFinish = true;
      onDismissRef.current((event.currentTarget as HTMLElement).innerText);
    };
    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData?.getData('text/plain') ?? '');
    };

    editor.className = 'compose-media-text-editor';
    editor.contentEditable = 'plaintext-only';
    editor.dataset.placeholder = placeholder;
    editor.dataset.mediaTextEditor = 'true';
    editor.dataset.mediaTextMode = mode;
    editor.textContent = value;
    editor.addEventListener('keydown', handleKeyDown);
    editor.addEventListener('mousedown', handleMouseDown);
    editor.addEventListener('input', handleInput);
    editor.addEventListener('blur', handleBlur);
    editor.addEventListener('paste', handlePaste);
    block.after(editor);
    editor.focus();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);

    return () => {
      editor.removeEventListener('keydown', handleKeyDown);
      editor.removeEventListener('mousedown', handleMouseDown);
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('blur', handleBlur);
      editor.removeEventListener('paste', handlePaste);
      editor.remove();
    };
  }, [block, mode, placeholder, value]);

  return null;
}

export function ComposeMediaBlocks({
  contentRef,
  editorFrameRef,
  getContent,
  onContentChange,
}: ComposeMediaBlocksProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadTargetRef = useRef<HTMLElement | null>(null);
  const mediaTextDraftsRef = useRef<WeakMap<HTMLElement, MediaTextDrafts>>(new WeakMap());
  const editingMediaTextRef = useRef<EditingMediaText | null>(null);
  const commitMediaTextRef = useRef<(
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode,
    value: string
  ) => void>(() => {});
  const dismissMediaTextEditRef = useRef<(
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode,
    value: string
  ) => void>(() => {});
  const [mediaBlockControls, setMediaBlockControls] = useState<MediaBlockControl[]>([]);
  const [editingMediaText, setEditingMediaText] = useState<EditingMediaText | null>(null);

  const syncContent = useCallback(() => {
    const contentEditor = contentRef.current;

    if (contentEditor) {
      const contentSnapshot = contentEditor.cloneNode(true) as HTMLDivElement;

      contentSnapshot
        .querySelectorAll('[data-media-text-editor]')
        .forEach((node) => node.remove());
      contentSnapshot
        .querySelectorAll<HTMLElement>('[data-media-text-editing]')
        .forEach((node) => delete node.dataset.mediaTextEditing);
      onContentChange(getContent(contentSnapshot));
    }
  }, [contentRef, getContent, onContentChange]);

  const updateMediaBlockControls = useCallback(() => {
    const contentEditor = contentRef.current;
    const editorFrame = editorFrameRef.current;

    if (!contentEditor || !editorFrame) {
      setMediaBlockControls([]);
      return;
    }

    const controls = Array.from(
      contentEditor.querySelectorAll<HTMLElement>(textEditableBlockSelector)
    ).flatMap((block) => {
      const controlsPosition = getMediaBlockControlsPosition(block, editorFrame);
      const blockType = getMediaBlockType(block);

      if (!controlsPosition) {
        return [];
      }

      return [
        {
          block,
          altText: blockType === 'image'
            ? block.querySelector('img')?.alt ?? ''
            : block.querySelector('[data-media-alt]')?.textContent ?? '',
          caption: block.querySelector('figcaption')?.textContent ?? '',
          textActionsPosition: getMediaTextActionsPosition(block, editorFrame),
          controlsPosition,
        },
      ];
    });

    setMediaBlockControls(controls);
  }, [contentRef, editorFrameRef]);

  const clearMediaTextEditingMarker = (mediaBlock: HTMLElement | null) => {
    if (mediaBlock) {
      delete mediaBlock.dataset.mediaTextEditing;
    }
  };

  const getCommittedMediaText = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode
  ): string => {
    if (mode === 'alt') {
      return getMediaBlockType(mediaBlock) === 'image'
        ? mediaBlock.querySelector('img')?.alt ?? ''
        : mediaBlock.querySelector('[data-media-alt]')?.textContent ?? '';
    }

    return mediaBlock.querySelector('figcaption')?.textContent ?? '';
  };

  const setCommittedMediaText = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode,
    value: string
  ) => {
    const trimmedValue = value.trim();

    if (mode === 'alt') {
      if (getMediaBlockType(mediaBlock) === 'image') {
        const image = mediaBlock.querySelector('img');

        if (image) {
          image.alt = trimmedValue;
        }

        return;
      }

      let altBlock = mediaBlock.querySelector<HTMLElement>('[data-media-alt]');

      if (trimmedValue) {
        if (!altBlock) {
          altBlock = document.createElement('p');
          altBlock.dataset.mediaAlt = 'true';
          const caption = mediaBlock.querySelector('figcaption');

          if (caption) {
            caption.before(altBlock);
          } else {
            mediaBlock.append(altBlock);
          }
        }

        altBlock.textContent = trimmedValue;
      } else {
        altBlock?.remove();
      }

      return;
    }

    let caption = mediaBlock.querySelector('figcaption');

    if (trimmedValue) {
      if (!caption) {
        caption = document.createElement('figcaption');
        mediaBlock.append(caption);
      }

      caption.textContent = trimmedValue;
    } else {
      caption?.remove();
    }
  };

  const getMediaTextEditValue = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode
  ): string => {
    const draft = mediaTextDraftsRef.current.get(mediaBlock)?.[mode];

    return draft?.draftValue ?? getCommittedMediaText(mediaBlock, mode);
  };

  const clearMediaTextDraft = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode
  ) => {
    const drafts = mediaTextDraftsRef.current.get(mediaBlock);

    if (!drafts) {
      return;
    }

    delete drafts[mode];

    if (!drafts.alt && !drafts.caption) {
      mediaTextDraftsRef.current.delete(mediaBlock);
    }
  };

  useEffect(() => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const handleEditorClick = (event: MouseEvent) => {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        return;
      }

      const imagePicker = target.closest('[data-image-picker]');
      const mediaBlock = target.closest('[data-editor-block="image"]');

      if (!(mediaBlock instanceof HTMLElement) || !(imagePicker instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      imageUploadTargetRef.current = mediaBlock;
      imageInputRef.current?.click();
    };

    const observer = new MutationObserver(() => updateMediaBlockControls());

    contentEditor.addEventListener('click', handleEditorClick);
    observer.observe(contentEditor, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    requestAnimationFrame(updateMediaBlockControls);

    return () => {
      contentEditor.removeEventListener('click', handleEditorClick);
      observer.disconnect();
    };
  }, [contentRef, updateMediaBlockControls]);

  useEffect(() => {
    window.addEventListener('resize', updateMediaBlockControls);
    window.addEventListener('scroll', updateMediaBlockControls, true);

    return () => {
      window.removeEventListener('resize', updateMediaBlockControls);
      window.removeEventListener('scroll', updateMediaBlockControls, true);
    };
  }, [updateMediaBlockControls]);

  const handleRemoveImageBlock = (mediaBlock: HTMLElement) => {
    mediaBlock.remove();
    mediaTextDraftsRef.current.delete(mediaBlock);
    setEditingMediaText((currentEdit) =>
      currentEdit?.block === mediaBlock ? null : currentEdit
    );
    updateMediaBlockControls();
    syncContent();
  };

  const handleChangeImageBlock = (mediaBlock: HTMLElement) => {
    imageUploadTargetRef.current = mediaBlock;
    imageInputRef.current?.click();
  };

  const handleStartMediaTextEdit = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode
  ) => {
    const existingDrafts = mediaTextDraftsRef.current.get(mediaBlock) ?? {};

    if (!existingDrafts[mode]) {
      const defaultValue = getCommittedMediaText(mediaBlock, mode);
      existingDrafts[mode] = {
        defaultValue,
        draftValue: defaultValue,
      };
      mediaTextDraftsRef.current.set(mediaBlock, existingDrafts);
    }

    clearMediaTextEditingMarker(editingMediaText?.block ?? null);
    mediaBlock.dataset.mediaTextEditing = mode;
    setEditingMediaText({
      block: mediaBlock,
      mode,
      value: getMediaTextEditValue(mediaBlock, mode),
    });
    requestAnimationFrame(updateMediaBlockControls);
  };

  const handleDismissMediaTextEdit = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode,
    value: string
  ) => {
    const drafts = mediaTextDraftsRef.current.get(mediaBlock) ?? {};
    const currentDraft = drafts[mode];

    drafts[mode] = {
      defaultValue: currentDraft?.defaultValue ?? getCommittedMediaText(mediaBlock, mode),
      draftValue: value,
    };
    mediaTextDraftsRef.current.set(mediaBlock, drafts);

    clearMediaTextEditingMarker(mediaBlock);
    setEditingMediaText(null);
    requestAnimationFrame(updateMediaBlockControls);
  };

  const handleCommitMediaText = (
    mediaBlock: HTMLElement,
    mode: MediaTextEditMode,
    value: string
  ) => {
    setCommittedMediaText(mediaBlock, mode, value);
    clearMediaTextDraft(mediaBlock, mode);
    clearMediaTextEditingMarker(mediaBlock);
    setEditingMediaText(null);
    updateMediaBlockControls();
    syncContent();
  };

  useEffect(() => {
    editingMediaTextRef.current = editingMediaText;
    commitMediaTextRef.current = handleCommitMediaText;
    dismissMediaTextEditRef.current = handleDismissMediaTextEdit;
  });

  useEffect(() => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const getActiveMediaTextEditor = (event: KeyboardEvent): HTMLElement | null => {
      const target = event.target;

      if (target instanceof HTMLElement) {
        const targetEditor = target.closest('[data-media-text-editor]');

        if (targetEditor instanceof HTMLElement) {
          return targetEditor;
        }
      }

      const selectionNode = window.getSelection()?.anchorNode;
      const selectionElement =
        selectionNode instanceof HTMLElement ? selectionNode : selectionNode?.parentElement;
      const selectionEditor = selectionElement?.closest('[data-media-text-editor]');

      return selectionEditor instanceof HTMLElement ? selectionEditor : null;
    };

    const handleMediaTextEditorKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' &&
        event.key !== 'Escape' &&
        event.key !== 'ArrowDown'
      ) {
        return;
      }

      const activeEditor = getActiveMediaTextEditor(event);

      const currentEdit = editingMediaTextRef.current;

      if (!activeEditor || !currentEdit) {
        return;
      }

      if (event.key === 'ArrowDown') {
        handleMediaTextEditorArrowDown(event, activeEditor);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.key === 'Enter') {
        commitMediaTextRef.current(
          currentEdit.block,
          currentEdit.mode,
          activeEditor.innerText
        );
        return;
      }

      dismissMediaTextEditRef.current(
        currentEdit.block,
        currentEdit.mode,
        activeEditor.innerText
      );
    };

    contentEditor.addEventListener('keydown', handleMediaTextEditorKeyDown, true);

    return () => {
      contentEditor.removeEventListener('keydown', handleMediaTextEditorKeyDown, true);
    };
  }, [contentRef]);

  useEffect(() => {
    const handleOutsideMediaTextEditPointerDown = (event: PointerEvent) => {
      const currentEdit = editingMediaTextRef.current;
      const target = event.target;

      if (!currentEdit || !(target instanceof HTMLElement)) {
        return;
      }

      const activeEditor = document.querySelector<HTMLElement>('[data-media-text-editor]');

      if (
        currentEdit.block.contains(target) ||
        activeEditor?.contains(target) ||
        target.closest('[data-media-text-actions]') ||
        target.closest('[data-image-block-controls]')
      ) {
        return;
      }

      dismissMediaTextEditRef.current(
        currentEdit.block,
        currentEdit.mode,
        activeEditor?.innerText ?? currentEdit.value
      );
    };

    document.addEventListener('pointerdown', handleOutsideMediaTextEditPointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideMediaTextEditPointerDown, true);
    };
  }, []);

  useEffect(() => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const isInsideActiveMediaTextArea = (
      node: Node | null,
      activeEditor: HTMLElement | null,
      currentEdit: EditingMediaText
    ): boolean => {
      if (!node) {
        return false;
      }

      return (
        currentEdit.block.contains(node) ||
        Boolean(activeEditor?.contains(node))
      );
    };

    const handleSelectionChange = () => {
      requestAnimationFrame(() => {
        const currentEdit = editingMediaTextRef.current;

        if (!currentEdit) {
          return;
        }

        const activeEditor = contentEditor.querySelector<HTMLElement>(
          '[data-media-text-editor]'
        );
        const activeElement = document.activeElement;
        const selectionNode = window.getSelection()?.anchorNode ?? null;

        if (
          isInsideActiveMediaTextArea(selectionNode, activeEditor, currentEdit) ||
          isInsideActiveMediaTextArea(activeElement, activeEditor, currentEdit) ||
          (
            activeElement instanceof HTMLElement &&
            (
              activeElement.closest('[data-media-text-actions]') ||
              activeElement.closest('[data-image-block-controls]')
            )
          )
        ) {
          return;
        }

        dismissMediaTextEditRef.current(
          currentEdit.block,
          currentEdit.mode,
          activeEditor?.innerText ?? currentEdit.value
        );
      });
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [contentRef]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const mediaBlock = imageUploadTargetRef.current;

    event.target.value = '';

    if (!file || !mediaBlock || !contentRef.current) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';

      if (!src) {
        return;
      }

      let image = mediaBlock.querySelector('img');

      if (!image) {
        image = document.createElement('img');
        image.alt = '';
        image.loading = 'lazy';
        mediaBlock.prepend(image);
      }

      image.src = src;

      const button = mediaBlock.querySelector('[data-image-picker]');

      if (button) {
        button.textContent = 'Change image';
      }

      syncContent();
      requestAnimationFrame(updateMediaBlockControls);
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      {mediaBlockControls.map(({
        altText,
        block,
        caption,
        controlsPosition,
        textActionsPosition,
      }, index) => {
        const currentEdit =
          editingMediaText?.block === block ? editingMediaText : null;
        const blockType = getMediaBlockType(block);

        return (
          <div key={index}>
            {blockType === 'image' && (
              <ComposeMediaBlockControls
                position={controlsPosition}
                onChange={() => handleChangeImageBlock(block)}
                onRemove={() => handleRemoveImageBlock(block)}
              />
            )}

            {textActionsPosition && (
              <ComposeMediaTextActions
                activeMode={currentEdit?.mode ?? null}
                hasAltText={Boolean(altText)}
                hasCaption={Boolean(caption)}
                isActive={Boolean(currentEdit)}
                position={textActionsPosition}
                onStartEditing={(mode) => handleStartMediaTextEdit(block, mode)}
              />
            )}

            {currentEdit && (
              <ComposeMediaTextEditor
                block={currentEdit.block}
                mode={currentEdit.mode}
                value={currentEdit.value}
                onCommit={(value) => handleCommitMediaText(
                  currentEdit.block,
                  currentEdit.mode,
                  value
                )}
                onDismiss={(value) => handleDismissMediaTextEdit(
                  currentEdit.block,
                  currentEdit.mode,
                  value
                )}
              />
            )}
          </div>
        );
      })}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
    </>
  );
}
