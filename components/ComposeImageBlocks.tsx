'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

interface ComposeImageBlocksProps {
  contentRef: RefObject<HTMLDivElement | null>;
  editorFrameRef: RefObject<HTMLDivElement | null>;
  getContent: (element: HTMLDivElement) => string;
  onContentChange: (content: string) => void;
}

interface ImageBlockControlsPosition {
  top: number;
  left: number;
}

interface ImageBlockAltTextPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface ImageBlockControl {
  block: HTMLElement;
  altText: string;
  caption: string;
  altTextPosition: ImageBlockAltTextPosition | null;
  controlsPosition: ImageBlockControlsPosition;
}

type ImageTextEditMode = 'alt' | 'caption';

interface ComposeImageBlockControlsProps {
  position: ImageBlockControlsPosition;
  onChange: () => void;
  onRemove: () => void;
}

interface ComposeImageBlockAltTextProps {
  activeMode: ImageTextEditMode | null;
  hasAltText: boolean;
  hasCaption: boolean;
  isActive: boolean;
  position: ImageBlockAltTextPosition;
  onStartEditing: (mode: ImageTextEditMode) => void;
}

interface ComposeImageTextEditorProps {
  block: HTMLElement;
  mode: ImageTextEditMode;
  value: string;
  onCommit: (value: string) => void;
  onDismiss: (value: string) => void;
}

interface ImageTextDraftState {
  defaultValue: string;
  draftValue: string;
}

type ImageTextDrafts = Partial<Record<ImageTextEditMode, ImageTextDraftState>>;

interface EditingImageText {
  block: HTMLElement;
  mode: ImageTextEditMode;
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

function handleImageTextEditorArrowDown(
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

function getImageBlockControlsPosition(
  block: HTMLElement,
  container: HTMLElement
): ImageBlockControlsPosition | null {
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

function getImageBlockAltTextPosition(
  block: HTMLElement,
  container: HTMLElement
): ImageBlockAltTextPosition | null {
  const image = block.querySelector('img');
  const rect = image?.getBoundingClientRect() ?? block.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (
    !block.isConnected ||
    !image ||
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

function ComposeImageBlockControls({
  position,
  onChange,
  onRemove,
}: ComposeImageBlockControlsProps) {
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

function ComposeImageBlockAltText({
  activeMode,
  hasAltText,
  hasCaption,
  isActive,
  position,
  onStartEditing,
}: ComposeImageBlockAltTextProps) {
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
      data-image-alt-text-control
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
          className="compose-image-action-link"
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
          className="compose-image-action-link"
          data-active={activeMode === 'caption' ? 'true' : undefined}
        >
          {activeMode === 'caption' ? 'Save caption' : hasCaption ? 'Edit caption' : 'Write caption'}
        </a>
      </div>
    </div>
  );
}

function ComposeImageTextEditor({
  block,
  mode,
  value,
  onCommit,
  onDismiss,
}: ComposeImageTextEditorProps) {
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
        handleImageTextEditorArrowDown(event, editor);
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

    editor.className = 'compose-image-text-editor';
    editor.contentEditable = 'plaintext-only';
    editor.dataset.placeholder = placeholder;
    editor.dataset.imageTextEditor = 'true';
    editor.dataset.imageTextMode = mode;
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

export function ComposeImageBlocks({
  contentRef,
  editorFrameRef,
  getContent,
  onContentChange,
}: ComposeImageBlocksProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadTargetRef = useRef<HTMLElement | null>(null);
  const imageTextDraftsRef = useRef<WeakMap<HTMLElement, ImageTextDrafts>>(new WeakMap());
  const editingImageTextRef = useRef<EditingImageText | null>(null);
  const commitImageTextRef = useRef<(
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => void>(() => {});
  const dismissImageTextEditRef = useRef<(
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => void>(() => {});
  const [imageBlockControls, setImageBlockControls] = useState<ImageBlockControl[]>([]);
  const [editingImageText, setEditingImageText] = useState<EditingImageText | null>(null);

  const syncContent = useCallback(() => {
    const contentEditor = contentRef.current;

    if (contentEditor) {
      const contentSnapshot = contentEditor.cloneNode(true) as HTMLDivElement;

      contentSnapshot
        .querySelectorAll('[data-image-text-editor]')
        .forEach((node) => node.remove());
      contentSnapshot
        .querySelectorAll<HTMLElement>('[data-image-text-editing]')
        .forEach((node) => delete node.dataset.imageTextEditing);
      onContentChange(getContent(contentSnapshot));
    }
  }, [contentRef, getContent, onContentChange]);

  const updateImageBlockControls = useCallback(() => {
    const contentEditor = contentRef.current;
    const editorFrame = editorFrameRef.current;

    if (!contentEditor || !editorFrame) {
      setImageBlockControls([]);
      return;
    }

    const controls = Array.from(
      contentEditor.querySelectorAll<HTMLElement>('[data-editor-block="image"]')
    ).flatMap((block) => {
      const controlsPosition = getImageBlockControlsPosition(block, editorFrame);
      const image = block.querySelector('img');

      if (!controlsPosition) {
        return [];
      }

      return [
        {
          block,
          altText: image?.alt ?? '',
          caption: block.querySelector('figcaption')?.textContent ?? '',
          altTextPosition: getImageBlockAltTextPosition(block, editorFrame),
          controlsPosition,
        },
      ];
    });

    setImageBlockControls(controls);
  }, [contentRef, editorFrameRef]);

  const clearImageTextEditingMarker = (imageBlock: HTMLElement | null) => {
    if (imageBlock) {
      delete imageBlock.dataset.imageTextEditing;
    }
  };

  const getCommittedImageText = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode
  ): string => {
    if (mode === 'alt') {
      return imageBlock.querySelector('img')?.alt ?? '';
    }

    return imageBlock.querySelector('figcaption')?.textContent ?? '';
  };

  const setCommittedImageText = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => {
    const trimmedValue = value.trim();

    if (mode === 'alt') {
      const image = imageBlock.querySelector('img');

      if (image) {
        image.alt = trimmedValue;
      }

      return;
    }

    let caption = imageBlock.querySelector('figcaption');

    if (trimmedValue) {
      if (!caption) {
        caption = document.createElement('figcaption');
        imageBlock.append(caption);
      }

      caption.textContent = trimmedValue;
    } else {
      caption?.remove();
    }
  };

  const getImageTextEditValue = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode
  ): string => {
    const draft = imageTextDraftsRef.current.get(imageBlock)?.[mode];

    return draft?.draftValue ?? getCommittedImageText(imageBlock, mode);
  };

  const clearImageTextDraft = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode
  ) => {
    const drafts = imageTextDraftsRef.current.get(imageBlock);

    if (!drafts) {
      return;
    }

    delete drafts[mode];

    if (!drafts.alt && !drafts.caption) {
      imageTextDraftsRef.current.delete(imageBlock);
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
      const imageBlock = target.closest('[data-editor-block="image"]');

      if (!(imageBlock instanceof HTMLElement) || !(imagePicker instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      imageUploadTargetRef.current = imageBlock;
      imageInputRef.current?.click();
    };

    const observer = new MutationObserver(() => updateImageBlockControls());

    contentEditor.addEventListener('click', handleEditorClick);
    observer.observe(contentEditor, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    requestAnimationFrame(updateImageBlockControls);

    return () => {
      contentEditor.removeEventListener('click', handleEditorClick);
      observer.disconnect();
    };
  }, [contentRef, updateImageBlockControls]);

  useEffect(() => {
    window.addEventListener('resize', updateImageBlockControls);
    window.addEventListener('scroll', updateImageBlockControls, true);

    return () => {
      window.removeEventListener('resize', updateImageBlockControls);
      window.removeEventListener('scroll', updateImageBlockControls, true);
    };
  }, [updateImageBlockControls]);

  const handleRemoveImageBlock = (imageBlock: HTMLElement) => {
    imageBlock.remove();
    imageTextDraftsRef.current.delete(imageBlock);
    setEditingImageText((currentEdit) =>
      currentEdit?.block === imageBlock ? null : currentEdit
    );
    updateImageBlockControls();
    syncContent();
  };

  const handleChangeImageBlock = (imageBlock: HTMLElement) => {
    imageUploadTargetRef.current = imageBlock;
    imageInputRef.current?.click();
  };

  const handleStartImageTextEdit = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode
  ) => {
    const existingDrafts = imageTextDraftsRef.current.get(imageBlock) ?? {};

    if (!existingDrafts[mode]) {
      const defaultValue = getCommittedImageText(imageBlock, mode);
      existingDrafts[mode] = {
        defaultValue,
        draftValue: defaultValue,
      };
      imageTextDraftsRef.current.set(imageBlock, existingDrafts);
    }

    clearImageTextEditingMarker(editingImageText?.block ?? null);
    imageBlock.dataset.imageTextEditing = mode;
    setEditingImageText({
      block: imageBlock,
      mode,
      value: getImageTextEditValue(imageBlock, mode),
    });
    requestAnimationFrame(updateImageBlockControls);
  };

  const handleDismissImageTextEdit = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => {
    const drafts = imageTextDraftsRef.current.get(imageBlock) ?? {};
    const currentDraft = drafts[mode];

    drafts[mode] = {
      defaultValue: currentDraft?.defaultValue ?? getCommittedImageText(imageBlock, mode),
      draftValue: value,
    };
    imageTextDraftsRef.current.set(imageBlock, drafts);

    clearImageTextEditingMarker(imageBlock);
    setEditingImageText(null);
    requestAnimationFrame(updateImageBlockControls);
  };

  const handleCommitImageText = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => {
    setCommittedImageText(imageBlock, mode, value);
    clearImageTextDraft(imageBlock, mode);
    clearImageTextEditingMarker(imageBlock);
    setEditingImageText(null);
    updateImageBlockControls();
    syncContent();
  };

  useEffect(() => {
    editingImageTextRef.current = editingImageText;
    commitImageTextRef.current = handleCommitImageText;
    dismissImageTextEditRef.current = handleDismissImageTextEdit;
  });

  useEffect(() => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const getActiveImageTextEditor = (event: KeyboardEvent): HTMLElement | null => {
      const target = event.target;

      if (target instanceof HTMLElement) {
        const targetEditor = target.closest('[data-image-text-editor]');

        if (targetEditor instanceof HTMLElement) {
          return targetEditor;
        }
      }

      const selectionNode = window.getSelection()?.anchorNode;
      const selectionElement =
        selectionNode instanceof HTMLElement ? selectionNode : selectionNode?.parentElement;
      const selectionEditor = selectionElement?.closest('[data-image-text-editor]');

      return selectionEditor instanceof HTMLElement ? selectionEditor : null;
    };

    const handleImageTextEditorKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' &&
        event.key !== 'Escape' &&
        event.key !== 'ArrowDown'
      ) {
        return;
      }

      const activeEditor = getActiveImageTextEditor(event);

      const currentEdit = editingImageTextRef.current;

      if (!activeEditor || !currentEdit) {
        return;
      }

      if (event.key === 'ArrowDown') {
        handleImageTextEditorArrowDown(event, activeEditor);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (event.key === 'Enter') {
        commitImageTextRef.current(
          currentEdit.block,
          currentEdit.mode,
          activeEditor.innerText
        );
        return;
      }

      dismissImageTextEditRef.current(
        currentEdit.block,
        currentEdit.mode,
        activeEditor.innerText
      );
    };

    contentEditor.addEventListener('keydown', handleImageTextEditorKeyDown, true);

    return () => {
      contentEditor.removeEventListener('keydown', handleImageTextEditorKeyDown, true);
    };
  }, [contentRef]);

  useEffect(() => {
    const handleOutsideImageTextEditPointerDown = (event: PointerEvent) => {
      const currentEdit = editingImageTextRef.current;
      const target = event.target;

      if (!currentEdit || !(target instanceof HTMLElement)) {
        return;
      }

      const activeEditor = document.querySelector<HTMLElement>('[data-image-text-editor]');

      if (
        currentEdit.block.contains(target) ||
        activeEditor?.contains(target) ||
        target.closest('[data-image-alt-text-control]') ||
        target.closest('[data-image-block-controls]')
      ) {
        return;
      }

      dismissImageTextEditRef.current(
        currentEdit.block,
        currentEdit.mode,
        activeEditor?.innerText ?? currentEdit.value
      );
    };

    document.addEventListener('pointerdown', handleOutsideImageTextEditPointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideImageTextEditPointerDown, true);
    };
  }, []);

  useEffect(() => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return;
    }

    const isInsideActiveImageTextArea = (
      node: Node | null,
      activeEditor: HTMLElement | null,
      currentEdit: EditingImageText
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
        const currentEdit = editingImageTextRef.current;

        if (!currentEdit) {
          return;
        }

        const activeEditor = contentEditor.querySelector<HTMLElement>(
          '[data-image-text-editor]'
        );
        const activeElement = document.activeElement;
        const selectionNode = window.getSelection()?.anchorNode ?? null;

        if (
          isInsideActiveImageTextArea(selectionNode, activeEditor, currentEdit) ||
          isInsideActiveImageTextArea(activeElement, activeEditor, currentEdit) ||
          (
            activeElement instanceof HTMLElement &&
            (
              activeElement.closest('[data-image-alt-text-control]') ||
              activeElement.closest('[data-image-block-controls]')
            )
          )
        ) {
          return;
        }

        dismissImageTextEditRef.current(
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
    const imageBlock = imageUploadTargetRef.current;

    event.target.value = '';

    if (!file || !imageBlock || !contentRef.current) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';

      if (!src) {
        return;
      }

      let image = imageBlock.querySelector('img');

      if (!image) {
        image = document.createElement('img');
        image.alt = '';
        image.loading = 'lazy';
        imageBlock.prepend(image);
      }

      image.src = src;

      const button = imageBlock.querySelector('[data-image-picker]');

      if (button) {
        button.textContent = 'Change image';
      }

      syncContent();
      requestAnimationFrame(updateImageBlockControls);
    };

    reader.readAsDataURL(file);
  };

  return (
    <>
      {imageBlockControls.map(({
        altText,
        altTextPosition,
        block,
        caption,
        controlsPosition,
      }, index) => {
        const currentEdit =
          editingImageText?.block === block ? editingImageText : null;

        return (
          <div key={index}>
            <ComposeImageBlockControls
              position={controlsPosition}
              onChange={() => handleChangeImageBlock(block)}
              onRemove={() => handleRemoveImageBlock(block)}
            />

            {altTextPosition && (
              <ComposeImageBlockAltText
                activeMode={currentEdit?.mode ?? null}
                hasAltText={Boolean(altText)}
                hasCaption={Boolean(caption)}
                isActive={Boolean(currentEdit)}
                position={altTextPosition}
                onStartEditing={(mode) => handleStartImageTextEdit(block, mode)}
              />
            )}

            {currentEdit && (
              <ComposeImageTextEditor
                block={currentEdit.block}
                mode={currentEdit.mode}
                value={currentEdit.value}
                onCommit={(value) => handleCommitImageText(
                  currentEdit.block,
                  currentEdit.mode,
                  value
                )}
                onDismiss={(value) => handleDismissImageTextEdit(
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
