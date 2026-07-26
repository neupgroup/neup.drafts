'use client';

import { RefObject, useCallback, useEffect, useRef, useState } from 'react';

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
  editingMode: ImageTextEditMode | null;
  position: ImageBlockAltTextPosition;
  caption: string;
  value: string;
  onStartEditing: (mode: ImageTextEditMode) => void;
  onCancel: () => void;
  onCommit: (mode: ImageTextEditMode, value: string) => void;
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
  editingMode,
  position,
  caption,
  value,
  onStartEditing,
  onCancel,
  onCommit,
}: ComposeImageBlockAltTextProps) {
  return (
    <div
      data-image-alt-text-control
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height,
      }}
      className="group absolute z-[9] flex items-end justify-center bg-gradient-to-t from-slate-950/65 to-transparent p-4 opacity-0 transition-opacity duration-300 hover:opacity-100 focus-within:opacity-100"
    >
      {editingMode ? (
        <input
          autoFocus
          defaultValue={editingMode === 'alt' ? value : caption}
          placeholder={editingMode === 'alt' ? 'Add alt text' : 'Write caption'}
          onBlur={(event) => onCommit(editingMode, event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onCommit(editingMode, event.currentTarget.value);
            }

            if (event.key === 'Escape') {
              event.preventDefault();
              onCancel();
            }
          }}
          className="h-9 w-full max-w-md rounded-full border border-white/20 bg-white/95 px-4 text-center font-serif text-sm font-medium text-slate-700 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-300"
        />
      ) : (
        <div className="flex translate-y-3 items-center gap-5 font-serif text-sm font-semibold text-white opacity-0 shadow-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <a
            href="#"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              onStartEditing('alt');
            }}
            className="compose-image-action-link"
          >
            Add alt text
          </a>

          <a
            href="#"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault();
              onStartEditing('caption');
            }}
            className="compose-image-action-link"
          >
            Write caption
          </a>
        </div>
      )}
    </div>
  );
}

export function ComposeImageBlocks({
  contentRef,
  editorFrameRef,
  getContent,
  onContentChange,
}: ComposeImageBlocksProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadTargetRef = useRef<HTMLElement | null>(null);
  const [imageBlockControls, setImageBlockControls] = useState<ImageBlockControl[]>([]);
  const [editingImageText, setEditingImageText] = useState<{
    block: HTMLElement;
    mode: ImageTextEditMode;
  } | null>(null);

  const syncContent = useCallback(() => {
    const contentEditor = contentRef.current;

    if (contentEditor) {
      onContentChange(getContent(contentEditor));
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

  const handleCommitImageText = (
    imageBlock: HTMLElement,
    mode: ImageTextEditMode,
    value: string
  ) => {
    const trimmedValue = value.trim();
    const image = imageBlock.querySelector('img');

    if (mode === 'alt' && image) {
      image.alt = trimmedValue;
    }

    if (mode === 'caption') {
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
    }

    setEditingImageText(null);
    updateImageBlockControls();
    syncContent();
  };

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
      {imageBlockControls.map(({ altText, altTextPosition, block, caption, controlsPosition }, index) => (
        <div key={index}>
          <ComposeImageBlockControls
            position={controlsPosition}
            onChange={() => handleChangeImageBlock(block)}
            onRemove={() => handleRemoveImageBlock(block)}
          />

          {altTextPosition && (
            <ComposeImageBlockAltText
              editingMode={
                editingImageText?.block === block ? editingImageText.mode : null
              }
              position={altTextPosition}
              caption={caption}
              value={altText}
              onStartEditing={(mode) => setEditingImageText({ block, mode })}
              onCancel={() => setEditingImageText(null)}
              onCommit={(mode, value) => handleCommitImageText(block, mode, value)}
            />
          )}
        </div>
      ))}

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
