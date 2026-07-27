'use client';

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  createCalloutBlock,
  isCalloutBlockType,
  setCalloutBlockType,
  type CalloutBlockType,
} from './calloutBlock';
import { ComposeMediaBlocks, createImageBlock } from './ComposeImageBlocks';
import { EditorMenu, type EditorMenuAction } from './editorMenu';
import { snapSelectionRange } from './SmartSelectionBehavior';

interface ComposeArticle {
  id: string;
  title: string;
  content: string;
  slug: string | null;
}

interface ComposePostFormProps {
  article?: ComposeArticle;
}

type SlashMenuOption = 'image' | 'audio' | 'video' | 'carousel' | 'numbered-list' | 'unnumbered-list' | 'table';

type CalloutType = CalloutBlockType;
type SemanticBlockType = 'h2' | 'h3' | 'p' | 'callout' | 'ol' | 'ul';
type ListBlockType = 'ol' | 'ul';

interface SlashMenuPosition {
  top: number;
  left: number;
}

interface SelectionMenuPosition extends SlashMenuPosition {
  transform: string;
}

type VideoProvider = 'youtube' | 'vimeo';
type SelectionMenuMode = 'default' | 'callout';

const slashMenuOptions: Array<{
  id: SlashMenuOption;
  label: string;
}> = [
  { id: 'image', label: 'Add an image block' },
  { id: 'audio', label: 'Add an audio block' },
  { id: 'video', label: 'Add a video block' },
  { id: 'carousel', label: 'Add a carousel block' },
  { id: 'numbered-list', label: 'Add a numbered list' },
  { id: 'unnumbered-list', label: 'Add an unnumbered list' },
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

function normalizeEditorSpaces(value: string): string {
  return value.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');
}

function hasEditorHtml(value: string): boolean {
  return /<\/?(a|aside|audio|b|br|details|div|em|figcaption|figure|h1|h2|h3|i|iframe|img|li|mark|ol|p|strong|summary|table|tbody|td|track|tr|u|ul|video)(\s|>|\/)/i.test(value);
}

function downgradeEditorH1Html(value: string): string {
  return value
    .replace(/<h1(\s[^>]*)?>/gi, '<h2$1>')
    .replace(/<\/h1\s*>/gi, '</h2>');
}

function getEditorHtml(value: string): string {
  if (hasEditorHtml(value)) {
    return downgradeEditorH1Html(value);
  }

  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

function getEditorText(element: HTMLDivElement): string {
  normalizeEditorContent(element);

  const htmlContent = normalizeEditorSpaces(element.innerHTML.trim());

  if (
    htmlContent.includes('data-editor-block=') ||
    element.querySelector('a, aside, b, em, h2, h3, i, li, mark, ol, strong, u, ul')
  ) {
    return htmlContent;
  }

  const blocks = Array.from(element.children)
    .filter((child) => child instanceof HTMLElement)
    .map((child) => normalizeEditorSpaces(child.textContent ?? '').trim())
    .filter(Boolean);

  if (blocks.length > 0) {
    return blocks.join('\n\n');
  }

  return normalizeEditorSpaces(element.innerText).trim();
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

function sanitizeClipboardLinkUrl(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('/') && !trimmedValue.startsWith('//')) {
    return trimmedValue;
  }

  try {
    const url = new URL(trimmedValue);

    if (['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    return '';
  }

  return '';
}

function wrapClipboardInlineNodes(tagName: 'strong' | 'em' | 'u' | 'mark', nodes: Node[]): Node[] {
  if (nodes.length === 0) {
    return [];
  }

  const element = document.createElement(tagName);
  nodes.forEach((node) => element.append(node));

  return [element];
}

function sanitizeClipboardInlineNode(node: Node): Node[] {
  if (node.nodeType === Node.TEXT_NODE) {
    return [document.createTextNode(normalizeEditorSpaces(node.textContent ?? ''))];
  }

  if (!(node instanceof HTMLElement)) {
    return [];
  }

  const tagName = node.tagName.toLowerCase();
  const sanitizedChildren = Array.from(node.childNodes).flatMap((child) =>
    sanitizeClipboardInlineNode(child)
  );

  if (tagName === 'br') {
    return [document.createElement('br')];
  }

  if (['script', 'style', 'meta', 'link', 'head', 'title'].includes(tagName)) {
    return [];
  }

  if (tagName === 'a') {
    const href = sanitizeClipboardLinkUrl(node.getAttribute('href') ?? '');

    if (!href) {
      return sanitizedChildren;
    }

    const link = document.createElement('a');
    link.href = href;

    if (node.getAttribute('target') === '_blank') {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }

    sanitizedChildren.forEach((child) => link.append(child));

    return [link];
  }

  if (tagName === 'strong' || tagName === 'b') {
    return wrapClipboardInlineNodes('strong', sanitizedChildren);
  }

  if (tagName === 'em' || tagName === 'i') {
    return wrapClipboardInlineNodes('em', sanitizedChildren);
  }

  if (tagName === 'u') {
    return wrapClipboardInlineNodes('u', sanitizedChildren);
  }

  if (tagName === 'mark') {
    return wrapClipboardInlineNodes('mark', sanitizedChildren);
  }

  const style = (node.getAttribute('style') ?? '').toLowerCase();
  let wrappedNodes = sanitizedChildren;

  if (/(^|;)\s*font-weight\s*:\s*(bold|[6-9]00)/.test(style)) {
    wrappedNodes = wrapClipboardInlineNodes('strong', wrappedNodes);
  }

  if (/(^|;)\s*font-style\s*:\s*(italic|oblique)/.test(style)) {
    wrappedNodes = wrapClipboardInlineNodes('em', wrappedNodes);
  }

  if (/(^|;)\s*text-decoration(?:-line)?\s*:[^;]*underline/.test(style)) {
    wrappedNodes = wrapClipboardInlineNodes('u', wrappedNodes);
  }

  if (/(^|;)\s*background(?:-color)?\s*:/.test(style)) {
    wrappedNodes = wrapClipboardInlineNodes('mark', wrappedNodes);
  }

  return wrappedNodes;
}

function appendInlineClipboardChildren(target: HTMLElement, nodes: Node[]) {
  nodes.forEach((node) => {
    sanitizeClipboardInlineNode(node).forEach((sanitizedNode) => target.append(sanitizedNode));
  });

  if (!target.childNodes.length) {
    target.append(document.createElement('br'));
  }
}

function createEditorHeadingFromClipboard(
  node: HTMLElement,
  tagName: 'h2' | 'h3'
): HTMLHeadingElement {
  const heading = document.createElement(tagName);
  appendInlineClipboardChildren(heading, Array.from(node.childNodes));

  return heading;
}

function createEditorListItemFromClipboard(node: HTMLElement): HTMLLIElement {
  const listItem = document.createElement('li');

  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof HTMLElement) {
      const tagName = child.tagName.toLowerCase();

      if (tagName === 'ul' || tagName === 'ol') {
        listItem.append(createEditorListFromClipboard(child, tagName as ListBlockType));
        return;
      }
    }

    sanitizeClipboardInlineNode(child).forEach((sanitizedNode) => listItem.append(sanitizedNode));
  });

  if (!listItem.childNodes.length) {
    listItem.append(document.createElement('br'));
  }

  return listItem;
}

function createEditorListFromClipboard(
  node: HTMLElement,
  tagName: ListBlockType
): HTMLOListElement | HTMLUListElement {
  const list = document.createElement(tagName);
  list.dataset.editorBlock = 'list';

  Array.from(node.children).forEach((child) => {
    if (!(child instanceof HTMLElement) || child.tagName.toLowerCase() !== 'li') {
      return;
    }

    list.append(createEditorListItemFromClipboard(child));
  });

  if (!list.childNodes.length) {
    list.append(createEditorListItemFromClipboard(document.createElement('li')));
  }

  return list;
}

function createEditorBlocksFromClipboardHtml(html: string): DocumentFragment | null {
  const template = document.createElement('template');
  template.innerHTML = html;

  const fragment = document.createDocumentFragment();
  let pendingParagraph: HTMLParagraphElement | null = null;
  const blockContainerTags = new Set([
    'address',
    'article',
    'blockquote',
    'body',
    'div',
    'footer',
    'header',
    'main',
    'nav',
    'section',
  ]);

  const ensurePendingParagraph = () => {
    if (!pendingParagraph) {
      pendingParagraph = createEditorParagraph();
      pendingParagraph.replaceChildren();
    }

    return pendingParagraph;
  };

  const flushPendingParagraph = () => {
    if (!pendingParagraph) {
      return;
    }

    if (!pendingParagraph.childNodes.length) {
      pendingParagraph.append(document.createElement('br'));
    }

    fragment.append(pendingParagraph);
    pendingParagraph = null;
  };

  const appendTopLevelNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (!node.textContent?.trim()) {
        return;
      }

      const paragraph = ensurePendingParagraph();
      sanitizeClipboardInlineNode(node).forEach((sanitizedNode) => paragraph.append(sanitizedNode));
      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === 'ul' || tagName === 'ol') {
      flushPendingParagraph();
      fragment.append(createEditorListFromClipboard(node, tagName as ListBlockType));
      return;
    }

    if (tagName === 'h1') {
      flushPendingParagraph();
      fragment.append(createEditorHeadingFromClipboard(node, 'h2'));
      return;
    }

    if (tagName === 'h2') {
      flushPendingParagraph();
      fragment.append(createEditorHeadingFromClipboard(node, 'h2'));
      return;
    }

    if (tagName === 'h3') {
      flushPendingParagraph();
      fragment.append(createEditorHeadingFromClipboard(node, 'h3'));
      return;
    }

    if (['h4', 'h5', 'h6'].includes(tagName)) {
      flushPendingParagraph();
      fragment.append(createEditorHeadingFromClipboard(node, 'h3'));
      return;
    }

    if (tagName === 'p') {
      flushPendingParagraph();
      const paragraph = createEditorParagraph();
      paragraph.replaceChildren();
      appendInlineClipboardChildren(paragraph, Array.from(node.childNodes));
      fragment.append(paragraph);
      return;
    }

    if (blockContainerTags.has(tagName)) {
      flushPendingParagraph();
      Array.from(node.childNodes).forEach(appendTopLevelNode);
      flushPendingParagraph();
      return;
    }

    const paragraph = ensurePendingParagraph();
    sanitizeClipboardInlineNode(node).forEach((sanitizedNode) => paragraph.append(sanitizedNode));
  };

  Array.from(template.content.childNodes).forEach(appendTopLevelNode);
  flushPendingParagraph();

  return fragment.childNodes.length > 0 ? fragment : null;
}

function isPastedBlockFragment(fragment: DocumentFragment): boolean {
  return Array.from(fragment.childNodes).some((node) => {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    const tagName = node.tagName.toLowerCase();

    return ['h2', 'h3', 'p', 'ol', 'ul'].includes(tagName) ||
      Boolean(node.dataset.editorBlock);
  });
}

function isEditorBlockEmpty(block: HTMLElement): boolean {
  return !block.textContent?.replace(/\u00a0/g, ' ').trim() &&
    !block.querySelector('img, iframe, audio, video, table');
}

function createEditorFragmentFromPlainText(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const normalizedText = normalizeEditorSpaces(text);
  const paragraphs = normalizedText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (paragraphs.length <= 1) {
    fragment.append(createEditorParagraph(normalizedText));
    return fragment;
  }

  paragraphs.forEach((paragraphText) => {
    fragment.append(createEditorParagraph(paragraphText));
  });

  return fragment;
}

function insertFragmentAtSelection(editor: HTMLDivElement, fragment: DocumentFragment) {
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const lastChild = fragment.lastChild;

  if (!range) {
    editor.append(fragment);
    return;
  }

  if (isPastedBlockFragment(fragment)) {
    const startBlock = getEditorBlockForNode(editor, range.startContainer);
    const endBlock = getEditorBlockForNode(editor, range.endContainer);

    if (startBlock === endBlock && startBlock !== editor && startBlock.parentElement === editor) {
      if (isEditorBlockEmpty(startBlock)) {
        startBlock.replaceWith(fragment);
      } else {
        range.deleteContents();
        startBlock.after(fragment);
      }

      if (lastChild) {
        const nextRange = document.createRange();
        nextRange.setStartAfter(lastChild);
        nextRange.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(nextRange);
      }

      return;
    }
  }

  range.deleteContents();
  range.insertNode(fragment);

  if (lastChild) {
    const nextRange = document.createRange();
    nextRange.setStartAfter(lastChild);
    nextRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(nextRange);
  }
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

function getSelectionTextRange(editor: HTMLDivElement): Range | null {
  const selection = window.getSelection();

  if (
    !selection ||
    selection.isCollapsed ||
    !selection.rangeCount ||
    !selection.anchorNode ||
    !selection.focusNode ||
    !editor.contains(selection.anchorNode) ||
    !editor.contains(selection.focusNode)
  ) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const startBlock = getEditorBlockForNode(editor, range.startContainer);
  const endBlock = getEditorBlockForNode(editor, range.endContainer);

  if (
    startBlock !== endBlock ||
    (
      startBlock.dataset.editorBlock &&
      startBlock.dataset.editorBlock !== 'callout' &&
      startBlock.dataset.editorBlock !== 'list'
    ) ||
    !range.toString().trim()
  ) {
    return null;
  }

  return range;
}

function getElementForNode(node: Node): HTMLElement | null {
  return node instanceof HTMLElement ? node : node.parentElement;
}

function normalizeEditorContent(element: HTMLElement) {
  element.normalize();
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      normalizeEditorContent(child);
    }
  });
}

function normalizeInlineMutationRange(range: Range): Range {
  const commonElement = getElementForNode(range.commonAncestorContainer);
  const editorBlock = commonElement?.closest('p, h2, h3, aside, li');

  if (editorBlock) {
    editorBlock.normalize();
  }

  return range;
}

function nodeHasAncestorMatching(
  node: Node,
  selector: string,
  editor: HTMLDivElement
): boolean {
  const element = getElementForNode(node);
  const matchingElement = element?.closest(selector);

  return Boolean(matchingElement && editor.contains(matchingElement));
}

function rangeHasElementMatching(
  range: Range,
  selector: string,
  editor: HTMLDivElement
): boolean {
  const commonElement = getElementForNode(range.commonAncestorContainer);

  if (commonElement?.matches(selector)) {
    return true;
  }

  if (nodeHasAncestorMatching(range.startContainer, selector, editor)) {
    return true;
  }

  if (nodeHasAncestorMatching(range.endContainer, selector, editor)) {
    return true;
  }

  const selectedContent = range.cloneContents();

  return Boolean(
    Array.from(selectedContent.querySelectorAll(selector)).find((node) =>
      node.textContent?.trim()
    )
  );
}

function getRangeTextFormatCounts(range: Range, selector: string): {
  formatted: number;
  unformatted: number;
} {
  const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
    ? range.commonAncestorContainer.parentNode
    : range.commonAncestorContainer;
  let formatted = 0;
  let unformatted = 0;
  const textNodes = root
    ? getTextNodesInRange(root, range)
    : [];

  textNodes.forEach((node) => {
    const textLength = getSelectedTextLength(range, node);
    const element = getElementForNode(node);

    if (element?.closest(selector)) {
      formatted += textLength;
    } else {
      unformatted += textLength;
    }
  });

  return { formatted, unformatted };
}

function getTextNodesInRange(root: Node, range: Range): Text[] {
  if (root.nodeType === Node.TEXT_NODE) {
    return range.intersectsNode(root) ? [root as Text] : [];
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node = walker.nextNode();

  while (node) {
    if (range.intersectsNode(node)) {
      textNodes.push(node as Text);
    }

    node = walker.nextNode();
  }

  return textNodes;
}

function getSelectedTextLength(range: Range, textNode: Text): number {
  const textLength = textNode.textContent?.length ?? 0;
  let startOffset = 0;
  let endOffset = textLength;

  if (range.startContainer === textNode) {
    startOffset = range.startOffset;
  }

  if (range.endContainer === textNode) {
    endOffset = range.endOffset;
  }

  return Math.max(0, endOffset - startOffset);
}

function getSelectionMenuActiveActions(
  editor: HTMLDivElement,
  range: Range
): EditorMenuAction[] {
  const activeActions: EditorMenuAction[] = [];
  const activeBlock = getEditorBlockForNode(editor, range.startContainer);
  const activeBlockTagName = activeBlock.tagName.toLowerCase();

  if (activeBlockTagName === 'h2') {
    activeActions.push('h2');
  }

  if (activeBlockTagName === 'h3') {
    activeActions.push('h3');
  }

  if (activeBlockTagName === 'p') {
    activeActions.push('paragraph');
  }

  if (activeBlockTagName === 'ol') {
    activeActions.push('numbered-list');
  }

  if (activeBlockTagName === 'ul') {
    activeActions.push('unnumbered-list');
  }

  if (activeBlockTagName === 'aside') {
    const calloutType = activeBlock.dataset.calloutType;

    if (isCalloutBlockType(calloutType)) {
      activeActions.push('callout');
    }
  }

  if (rangeHasElementMatching(range, 'strong, b', editor)) {
    activeActions.push('bold');
  }

  if (rangeHasElementMatching(range, 'em, i', editor)) {
    activeActions.push('italic');
  }

  if (rangeHasElementMatching(range, 'u', editor)) {
    activeActions.push('underline');
  }

  const highlightCounts = getRangeTextFormatCounts(range, 'mark');

  if (highlightCounts.formatted > highlightCounts.unformatted) {
    activeActions.push('highlight');
  }

  if (rangeHasElementMatching(range, 'a', editor)) {
    activeActions.push('link');
  }

  return activeActions;
}

function isCalloutElement(element: HTMLElement): boolean {
  return element.tagName.toLowerCase() === 'aside' &&
    isCalloutBlockType(element.dataset.calloutType);
}

function isListElement(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();

  return tagName === 'ol' || tagName === 'ul';
}

function isNumberedListElement(element: HTMLElement): boolean {
  return element.tagName.toLowerCase() === 'ol';
}

function getWordCount(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function unwrapInlineElements(root: ParentNode, selector: string) {
  Array.from(root.querySelectorAll(selector)).forEach((element) => {
    element.replaceWith(...Array.from(element.childNodes));
  });
}

function hasContent(node: Node): boolean {
  return Boolean(node.textContent || (node instanceof HTMLElement && node.children.length));
}

function splitClosestElementAtMarker(marker: HTMLElement, selector: string) {
  let target = marker.parentElement?.closest(selector);

  while (target instanceof HTMLElement) {
    const beforeRange = document.createRange();
    const afterRange = document.createRange();
    const before = target.cloneNode(false) as HTMLElement;
    const after = target.cloneNode(false) as HTMLElement;

    beforeRange.selectNodeContents(target);
    beforeRange.setEndBefore(marker);
    afterRange.selectNodeContents(target);
    afterRange.setStartAfter(marker);
    before.append(beforeRange.cloneContents());
    after.append(afterRange.cloneContents());

    const replacements: Node[] = [];

    if (hasContent(before)) {
      replacements.push(before);
    }

    replacements.push(marker);

    if (hasContent(after)) {
      replacements.push(after);
    }

    target.replaceWith(...replacements);
    target = marker.parentElement?.closest(selector);
  }
}

function insertAtSplitMarkBoundary(range: Range, node: Node): Range {
  const marker = document.createElement('span');

  marker.dataset.selectionBoundary = 'true';
  range.insertNode(marker);
  splitClosestElementAtMarker(marker, 'mark');
  marker.before(node);

  const nextRange = document.createRange();
  nextRange.selectNode(node);
  marker.remove();
  nextRange.selectNodeContents(node);

  return nextRange;
}

function insertFragmentAtSplitInlineBoundary(
  range: Range,
  fragment: DocumentFragment,
  selector: string
): Range {
  const marker = document.createElement('span');
  const nodes = Array.from(fragment.childNodes);

  marker.dataset.selectionBoundary = 'true';
  range.insertNode(marker);
  splitClosestElementAtMarker(marker, selector);

  if (nodes.length === 0) {
    const nextRange = document.createRange();

    nextRange.setStartBefore(marker);
    nextRange.collapse(true);
    marker.remove();

    return nextRange;
  }

  marker.before(fragment);

  const nextRange = document.createRange();
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];

  nextRange.setStartBefore(firstNode);
  nextRange.setEndAfter(lastNode);
  marker.remove();

  return nextRange;
}

function getSiblingMark(
  element: HTMLElement,
  direction: 'previous' | 'next'
): HTMLElement | null {
  let sibling = direction === 'previous'
    ? element.previousSibling
    : element.nextSibling;

  while (sibling?.nodeType === Node.TEXT_NODE && !sibling.textContent) {
    const emptySibling = sibling;
    sibling = direction === 'previous'
      ? sibling.previousSibling
      : sibling.nextSibling;
    emptySibling.remove();
  }

  return sibling instanceof HTMLElement && sibling.tagName === 'MARK'
    ? sibling
    : null;
}

function mergeAdjacentMarks(mark: HTMLElement): HTMLElement {
  let current = mark;
  let previousMark = getSiblingMark(current, 'previous');

  while (previousMark) {
    previousMark.append(...Array.from(current.childNodes));
    current.remove();
    current = previousMark;
    previousMark = getSiblingMark(current, 'previous');
  }

  let nextMark = getSiblingMark(current, 'next');

  while (nextMark) {
    current.append(...Array.from(nextMark.childNodes));
    nextMark.remove();
    nextMark = getSiblingMark(current, 'next');
  }

  current.parentNode?.normalize();

  return current;
}

function wrapRangeWithMark(range: Range): Range {
  const selectedContent = range.extractContents();
  const mark = document.createElement('mark');

  unwrapInlineElements(selectedContent, 'mark');
  mark.append(selectedContent);

  const nextRange = insertAtSplitMarkBoundary(range, mark);
  const mergedMark = mergeAdjacentMarks(mark);

  nextRange.selectNodeContents(mergedMark);
  restoreSelectionRange(nextRange);

  return nextRange;
}

function unwrapMarkFromRange(range: Range): Range {
  const selectedContent = range.extractContents();

  unwrapInlineElements(selectedContent, 'mark');

  const nextRange = normalizeInlineMutationRange(
    insertFragmentAtSplitInlineBoundary(range, selectedContent, 'mark')
  );
  restoreSelectionRange(nextRange);

  return nextRange;
}

function unwrapInlineFormatFromRange(range: Range, selector: string): Range {
  const selectedContent = range.extractContents();

  unwrapInlineElements(selectedContent, selector);

  const nextRange = normalizeInlineMutationRange(
    insertFragmentAtSplitInlineBoundary(range, selectedContent, selector)
  );
  restoreSelectionRange(nextRange);

  return nextRange;
}

function getListItemHtml(block: HTMLElement): string[] {
  const listItems = Array.from(block.querySelectorAll(':scope > li'))
    .map((item) => item.innerHTML.trim())
    .filter(Boolean);

  if (listItems.length > 0) {
    return listItems;
  }

  const blockHtml = block.innerHTML.trim();

  return blockHtml ? [blockHtml] : ['<br>'];
}

function createListBlock(listType: ListBlockType, items: string[] = ['']): HTMLOListElement | HTMLUListElement {
  const list = document.createElement(listType);

  list.dataset.editorBlock = 'list';
  list.dataset.listType = listType === 'ol' ? 'numbered' : 'unnumbered';

  items.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.innerHTML = item || '<br>';
    list.append(listItem);
  });

  return list;
}

function createSemanticBlock(
  blockType: SemanticBlockType,
  html: string,
  calloutType?: CalloutType
): HTMLElement {
  if (blockType === 'callout') {
    return createCalloutBlock(html, calloutType ?? 'informative');
  }

  if (blockType === 'ol' || blockType === 'ul') {
    return createListBlock(blockType, [html]);
  }

  const block = document.createElement(blockType);

  block.innerHTML = html || '<br>';

  return block;
}

function getSemanticBlockHtml(block: HTMLElement, blockType: SemanticBlockType): string {
  if (blockType === 'ol' || blockType === 'ul') {
    return block.innerHTML;
  }

  if (isListElement(block)) {
    return getListItemHtml(block).join('<br>');
  }

  return block.innerHTML;
}

function convertListBlockToParagraph(block: HTMLElement): HTMLParagraphElement {
  const paragraph = document.createElement('p');
  const html = getListItemHtml(block).join('<br>');

  paragraph.innerHTML = html || '<br>';
  block.replaceWith(paragraph);

  return paragraph;
}

function replaceSelectionBlock(
  editor: HTMLDivElement,
  range: Range,
  blockType: SemanticBlockType,
  calloutType?: CalloutType
): Range {
  const currentBlock = getEditorBlockForNode(editor, range.startContainer);
  const nextBlock = blockType === 'ol' || blockType === 'ul'
    ? createListBlock(blockType, getListItemHtml(currentBlock))
    : createSemanticBlock(blockType, getSemanticBlockHtml(currentBlock, blockType), calloutType);

  currentBlock.replaceWith(nextBlock);

  const nextRange = document.createRange();

  nextRange.selectNodeContents(nextBlock);
  restoreSelectionRange(nextRange);

  return nextRange;
}

function getSelectionMenuPosition(range: Range): SelectionMenuPosition | null {
  const rect = range.getBoundingClientRect();
  const visibleRect = rect.width || rect.height
    ? rect
    : Array.from(range.getClientRects()).find((clientRect) => clientRect.width || clientRect.height);

  if (!visibleRect) {
    return null;
  }

  return {
    top: window.scrollY + Math.max(8, visibleRect.top - 58),
    left: window.scrollX + visibleRect.left + visibleRect.width / 2,
    transform: 'translateX(-50%)',
  };
}

function isMenuPositionVisible(position: SlashMenuPosition): boolean {
  const viewportTop = position.top - window.scrollY;
  const viewportLeft = position.left - window.scrollX;

  return viewportTop >= 0 &&
    viewportTop <= window.innerHeight &&
    viewportLeft >= 0 &&
    viewportLeft <= window.innerWidth;
}

function restoreSelectionRange(range: Range) {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function wrapRangeWithInlineElement(
  range: Range,
  element: HTMLElement,
  nestedSelector?: string
): Range {
  const selectedContent = range.extractContents();

  if (nestedSelector) {
    unwrapInlineElements(selectedContent, nestedSelector);
  }

  element.append(selectedContent);
  range.insertNode(element);

  const nextRange = document.createRange();
  nextRange.selectNodeContents(element);
  restoreSelectionRange(nextRange);

  return nextRange;
}

function getSmartInlineSelectionRange(editor: HTMLDivElement, range: Range): Range | null {
  const activeBlock = getEditorBlockForNode(editor, range.startContainer);

  return snapSelectionRange(activeBlock, range);
}

function getSafeEditorLinkUrl(value: string): string | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (trimmedValue.startsWith('/') && !trimmedValue.startsWith('//')) {
    return trimmedValue;
  }

  try {
    const url = new URL(
      /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)
        ? trimmedValue
        : `https://${trimmedValue}`
    );

    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
      ? url.toString()
      : null;
  } catch {
    return null;
  }
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
  const selectionMenuRangeRef = useRef<Range | null>(null);
  const calloutMenuBlockRef = useRef<HTMLElement | null>(null);
  const pendingCalloutMenuBlockRef = useRef<HTMLElement | null>(null);
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
  const [selectionMenuPosition, setSelectionMenuPosition] = useState<SelectionMenuPosition | null>(null);
  const [activeSelectionMenuActions, setActiveSelectionMenuActions] = useState<EditorMenuAction[]>([]);
  const [showSelectionHeadingActions, setShowSelectionHeadingActions] = useState(true);
  const [selectionMenuMode, setSelectionMenuMode] = useState<SelectionMenuMode>('default');
  const [activeCalloutType, setActiveCalloutType] = useState<CalloutType>('informative');
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

  const closeSelectionMenu = () => {
    selectionMenuRangeRef.current = null;
    calloutMenuBlockRef.current = null;
    setSelectionMenuPosition(null);
    setActiveSelectionMenuActions([]);
    setShowSelectionHeadingActions(true);
    setSelectionMenuMode('default');
  };

  const openCalloutSelectionMenu = (block: HTMLElement) => {
    const rect = block.getBoundingClientRect();
    const calloutType = block.dataset.calloutType;
    const range = document.createRange();

    range.selectNodeContents(block);
    selectionMenuRangeRef.current = range;
    calloutMenuBlockRef.current = block;
    setActiveCalloutType(
      isCalloutBlockType(calloutType)
        ? calloutType
        : 'informative'
    );
    setActiveSelectionMenuActions(['callout']);
    setShowSelectionHeadingActions(false);
    setSelectionMenuMode('callout');
    setSelectionMenuPosition({
      top: window.scrollY + Math.max(8, rect.top - 58),
      left: window.scrollX + rect.left + rect.width / 2,
      transform: 'translateX(-50%)',
    });
    closeSlashMenu();
  };

  const rememberSelectedCalloutPointerDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const contentEditor = contentRef.current;
    const storedRange = selectionMenuRangeRef.current;

    pendingCalloutMenuBlockRef.current = null;

    if (!contentEditor || !storedRange || !(event.target instanceof Node)) {
      return;
    }

    const clickedElement = getElementForNode(event.target);
    const clickedCallout = clickedElement?.closest('aside[data-callout-type]');

    if (!(clickedCallout instanceof HTMLElement) || !isCalloutElement(clickedCallout)) {
      return;
    }

    const selectedBlock = getEditorBlockForNode(contentEditor, storedRange.startContainer);

    if (selectedBlock === clickedCallout && isCalloutElement(selectedBlock)) {
      pendingCalloutMenuBlockRef.current = clickedCallout;
    }
  };

  const openSelectedCalloutMenuAfterClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const contentEditor = contentRef.current;
    const pendingCallout = pendingCalloutMenuBlockRef.current;

    pendingCalloutMenuBlockRef.current = null;

    if (!contentEditor || !pendingCallout || !(event.target instanceof Node)) {
      return;
    }

    const clickedElement = getElementForNode(event.target);
    const clickedCallout = clickedElement?.closest('aside[data-callout-type]');

    if (clickedCallout !== pendingCallout || !contentEditor.contains(pendingCallout)) {
      return;
    }

    requestAnimationFrame(() => {
      openCalloutSelectionMenu(pendingCallout);
    });
  };

  const showDefaultSelectionMenu = () => {
    setSelectionMenuMode('default');
  };

  const handleCalloutTypeChange = (calloutType: CalloutType) => {
    const block = calloutMenuBlockRef.current;

    if (!block) {
      return;
    }

    setCalloutBlockType(block, calloutType);
    setActiveCalloutType(calloutType);

    if (contentRef.current) {
      setContent(getEditorText(contentRef.current));
    }
  };

  const closeVideoMenu = () => {
    slashMenuRangeRef.current = null;
    setVideoMenuPosition(null);
    setVideoUrl('');
    setVideoProvider('youtube');
  };

  const updateSelectionMenuFromSelection = () => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      closeSelectionMenu();
      return;
    }

    const range = getSelectionTextRange(contentEditor);

    if (!range) {
      closeSelectionMenu();
      return;
    }

    const position = getSelectionMenuPosition(range);

    if (!position) {
      closeSelectionMenu();
      return;
    }

    selectionMenuRangeRef.current = range.cloneRange();
    setSelectionMenuPosition(position);
    setActiveSelectionMenuActions(getSelectionMenuActiveActions(contentEditor, range));
    setShowSelectionHeadingActions(
      getWordCount(getEditorBlockForNode(contentEditor, range.startContainer).innerText) <= 15
    );
    calloutMenuBlockRef.current = null;
    setSelectionMenuMode('default');
    closeSlashMenu();
  };

  const updateSelectionMenuAfterSelectionMove = () => {
    requestAnimationFrame(() => {
      updateSelectionMenuFromSelection();
    });
  };

  const syncContentAfterFormat = () => {
    if (contentRef.current) {
      setContent(getEditorText(contentRef.current));
    }
  };

  const applySelectionFormat = (action: EditorMenuAction) => {
    const contentEditor = contentRef.current;
    const storedRange = selectionMenuRangeRef.current;

    if (!contentEditor || !storedRange) {
      return;
    }

    contentEditor.focus();
    restoreSelectionRange(storedRange);

    if (action === 'callout') {
      const storedBlock = getEditorBlockForNode(contentEditor, storedRange.startContainer);

      if (contentEditor.contains(storedBlock) && isCalloutElement(storedBlock)) {
        openCalloutSelectionMenu(storedBlock);
        return;
      }
    }

    const liveRange = getSelectionTextRange(contentEditor);

    if (!liveRange) {
      closeSelectionMenu();
      return;
    }

    if (
      action === 'h2' ||
      action === 'h3' ||
      action === 'paragraph' ||
      action === 'numbered-list' ||
      action === 'unnumbered-list'
    ) {
      selectionMenuRangeRef.current = replaceSelectionBlock(
        contentEditor,
        liveRange,
        action === 'paragraph'
          ? 'p'
          : action === 'numbered-list'
            ? 'ol'
            : action === 'unnumbered-list'
              ? 'ul'
              : action
      );
      syncContentAfterFormat();
      updateSelectionMenuAfterSelectionMove();
      return;
    }

    if (action === 'callout') {
      const activeBlock = getEditorBlockForNode(contentEditor, liveRange.startContainer);

      if (isCalloutElement(activeBlock)) {
        openCalloutSelectionMenu(activeBlock);
        return;
      }

      const nextRange = replaceSelectionBlock(
        contentEditor,
        liveRange,
        'callout',
        'informative'
      );
      const nextBlock = getEditorBlockForNode(contentEditor, nextRange.startContainer);

      setActiveCalloutType('informative');
      syncContentAfterFormat();
      openCalloutSelectionMenu(nextBlock);
      return;
    }

    const inlineRange = getSmartInlineSelectionRange(contentEditor, liveRange);

    if (!inlineRange) {
      closeSelectionMenu();
      return;
    }

    restoreSelectionRange(inlineRange);

    if (action === 'link') {
      const rawUrl = window.prompt('Link URL');

      if (rawUrl === null) {
        updateSelectionMenuAfterSelectionMove();
        return;
      }

      const safeUrl = getSafeEditorLinkUrl(rawUrl);

      if (!safeUrl) {
        setError('Enter a valid link URL.');
        updateSelectionMenuAfterSelectionMove();
        return;
      }

      const link = document.createElement('a');
      link.href = safeUrl;

      if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      selectionMenuRangeRef.current = wrapRangeWithInlineElement(inlineRange, link);
      setError('');
      syncContentAfterFormat();
      updateSelectionMenuAfterSelectionMove();
      return;
    }

    if (action === 'highlight') {
      const highlightCounts = getRangeTextFormatCounts(inlineRange, 'mark');
      const nextRange = highlightCounts.formatted > highlightCounts.unformatted
        ? unwrapMarkFromRange(inlineRange)
        : wrapRangeWithMark(inlineRange);

      selectionMenuRangeRef.current = nextRange;
      syncContentAfterFormat();
      updateSelectionMenuAfterSelectionMove();
      return;
    }

    if (action !== 'bold' && action !== 'italic' && action !== 'underline') {
      return;
    }

    const tagNameByAction: Record<typeof action, string> = {
      bold: 'strong',
      italic: 'em',
      underline: 'u',
    };
    const selectorByAction: Record<typeof action, string> = {
      bold: 'strong, b',
      italic: 'em, i',
      underline: 'u',
    };
    const selector = selectorByAction[action];
    const formatCounts = getRangeTextFormatCounts(inlineRange, selector);

    if (formatCounts.formatted > formatCounts.unformatted) {
      selectionMenuRangeRef.current = unwrapInlineFormatFromRange(inlineRange, selector);
      syncContentAfterFormat();
      updateSelectionMenuAfterSelectionMove();
      return;
    }

    const wrapper = document.createElement(tagNameByAction[action]);

    selectionMenuRangeRef.current = wrapRangeWithInlineElement(inlineRange, wrapper, selector);
    syncContentAfterFormat();
    updateSelectionMenuAfterSelectionMove();
  };

  const applyCurrentSelectionFormat = (action: EditorMenuAction): boolean => {
    const contentEditor = contentRef.current;

    if (!contentEditor) {
      return false;
    }

    const range = getSelectionTextRange(contentEditor);

    if (!range) {
      return false;
    }

    selectionMenuRangeRef.current = range.cloneRange();
    applySelectionFormat(action);

    return true;
  };

  const getKeyboardFormatAction = (
    event: ReactKeyboardEvent<HTMLDivElement>
  ): EditorMenuAction | null => {
    if (!event.metaKey && !event.ctrlKey) {
      return null;
    }

    const key = event.key.toLowerCase();

    if (key === 'b' && !event.shiftKey && !event.altKey) {
      return 'bold';
    }

    if (key === 'i' && !event.shiftKey && !event.altKey) {
      return 'italic';
    }

    if (key === 'u' && !event.shiftKey && !event.altKey) {
      return 'underline';
    }

    if (key === 'h' && event.shiftKey && !event.altKey) {
      return 'highlight';
    }

    if (key === 'k' && !event.shiftKey && !event.altKey) {
      return 'link';
    }

    return null;
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      updateSelectionMenuFromSelection();
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  });

  useEffect(() => {
    if (!selectionMenuPosition) {
      return;
    }

    const closeSelectionMenuOnPointerDown = (event: MouseEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('[data-selection-menu]')
      ) {
        return;
      }

      requestAnimationFrame(() => {
        updateSelectionMenuFromSelection();
      });
    };

    const closeSelectionMenuOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSelectionMenu();
      }
    };

    const closeSelectionMenuWhenHidden = () => {
      if (!isMenuPositionVisible(selectionMenuPosition)) {
        closeSelectionMenu();
      }
    };

    document.addEventListener('mousedown', closeSelectionMenuOnPointerDown);
    document.addEventListener('keydown', closeSelectionMenuOnEscape);
    window.addEventListener('scroll', closeSelectionMenuWhenHidden, true);
    window.addEventListener('resize', closeSelectionMenuWhenHidden);

    return () => {
      document.removeEventListener('mousedown', closeSelectionMenuOnPointerDown);
      document.removeEventListener('keydown', closeSelectionMenuOnEscape);
      window.removeEventListener('scroll', closeSelectionMenuWhenHidden, true);
      window.removeEventListener('resize', closeSelectionMenuWhenHidden);
    };
  });

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

    const listItem = isListElement(block)
      ? block.querySelector<HTMLElement>(':scope > li')
      : null;

    setCaretPosition(listItem ?? paragraph, 'start');
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

    if (option === 'numbered-list') {
      insertEditorBlock(createListBlock('ol'));
      return;
    }

    if (option === 'unnumbered-list') {
      insertEditorBlock(createListBlock('ul'));
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
    const nextContent = contentRef.current
      ? getEditorText(contentRef.current)
      : normalizeEditorSpaces(content);

    if (!title.trim() || !nextContent.trim()) {
      setError('Title and content are required.');
      return;
    }

    if (!isEditing && !slugBase) {
      setError('Title must contain letters or numbers.');
      return;
    }

    setLoading(true);
    setError('');
    setContent(nextContent);

    try {
      const res = await fetch(isEditing ? `/api/posts/${articleId}` : '/api/posts', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEditing
            ? { title, content: nextContent }
            : { title, slug: slugBase, content: nextContent, articleId }
        ),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isEditing ? 'Failed to update article' : 'Failed to publish post'));
      }

      if (isEditing) {
        router.refresh();
      } else {
        router.push(getArticlePath(data.post));
        router.refresh();
      }
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
            onMouseDown={rememberSelectedCalloutPointerDown}
            onClick={openSelectedCalloutMenuAfterClick}
            onKeyDown={(e) => {
              document.execCommand('defaultParagraphSeparator', false, 'p');

              const keyboardFormatAction = getKeyboardFormatAction(e);

              if (keyboardFormatAction) {
                e.preventDefault();
                applyCurrentSelectionFormat(keyboardFormatAction);
                return;
              }

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
              e.key === 'Backspace' &&
              isNumberedListElement(currentBlock) &&
              isCaretAtTextStart(currentBlock)
            ) {
              e.preventDefault();
              const paragraph = convertListBlockToParagraph(currentBlock);
              setCaretPosition(paragraph, 'start');
              setContent(getEditorText(e.currentTarget));
              closeSelectionMenu();
              return;
            }

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
            const html = e.clipboardData.getData('text/html');

            if (html.trim()) {
              const fragment = createEditorBlocksFromClipboardHtml(html);

              if (fragment) {
                e.preventDefault();
                insertFragmentAtSelection(e.currentTarget, fragment);
                setContent(getEditorText(e.currentTarget));
                return;
              }
            }

            e.preventDefault();
            const text = normalizeEditorSpaces(e.clipboardData.getData('text/plain'));
            const paragraphs = text
              .split(/\n{2,}/)
              .map((block) => block.trim())
              .filter(Boolean);

            if (paragraphs.length <= 1) {
              document.execCommand('insertText', false, text);
              return;
            }

            insertFragmentAtSelection(e.currentTarget, createEditorFragmentFromPlainText(text));
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

        {selectionMenuPosition && (
          <EditorMenu
            activeActions={activeSelectionMenuActions}
            activeCalloutType={activeCalloutType}
            mode={selectionMenuMode}
            position={selectionMenuPosition}
            showHeadingActions={showSelectionHeadingActions}
            onAction={applySelectionFormat}
            onBack={showDefaultSelectionMenu}
            onCalloutTypeChange={handleCalloutTypeChange}
          />
        )}

        {slashMenuPosition && (
          <div
            data-slash-menu
            style={{
              top: slashMenuPosition.top,
              left: slashMenuPosition.left,
            }}
            className="fixed z-40 w-56 border border-slate-200 bg-white p-1 shadow-lg"
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
            className="fixed z-40 w-80 border border-slate-200 bg-white p-3 shadow-lg"
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
