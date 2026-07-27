'use client';

interface TextSegment {
  node: Text;
  start: number;
  end: number;
}

function isWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function canUseTextNode(node: Node, root: HTMLElement): boolean {
  const element = node.parentElement;

  if (!element || !root.contains(element)) {
    return false;
  }

  return !element.closest('[contenteditable="false"]');
}

function getTextSegments(root: HTMLElement): TextSegment[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return canUseTextNode(node, root)
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  const segments: TextSegment[] = [];
  let offset = 0;
  let node = walker.nextNode();

  while (node) {
    const textNode = node as Text;
    const textLength = textNode.data.length;

    segments.push({
      node: textNode,
      start: offset,
      end: offset + textLength,
    });

    offset += textLength;
    node = walker.nextNode();
  }

  return segments;
}

function getRangeOffset(root: HTMLElement, container: Node, offset: number): number {
  const range = document.createRange();

  range.selectNodeContents(root);
  range.setEnd(container, offset);

  return range.toString().length;
}

function getTextPositionAtOffset(
  segments: TextSegment[],
  targetOffset: number,
  affinity: 'start' | 'end'
): { node: Text; offset: number } | null {
  if (segments.length === 0) {
    return null;
  }

  for (const segment of segments) {
    if (
      targetOffset > segment.end ||
      (affinity === 'start' && targetOffset === segment.end)
    ) {
      continue;
    }

    if (targetOffset < segment.start) {
      return { node: segment.node, offset: 0 };
    }

    return {
      node: segment.node,
      offset: Math.min(segment.node.data.length, targetOffset - segment.start),
    };
  }

  const lastSegment = segments[segments.length - 1];

  return { node: lastSegment.node, offset: lastSegment.node.data.length };
}

function getWordLikeTokens(text: string): Array<{ start: number; end: number }> {
  const tokens: Array<{ start: number; end: number }> = [];
  let tokenStart: number | null = null;

  for (let index = 0; index < text.length; index += 1) {
    if (isWhitespace(text[index])) {
      if (tokenStart !== null) {
        tokens.push({ start: tokenStart, end: index });
        tokenStart = null;
      }

      continue;
    }

    tokenStart ??= index;
  }

  if (tokenStart !== null) {
    tokens.push({ start: tokenStart, end: text.length });
  }

  return tokens;
}

function trimWhitespace(text: string, start: number, end: number): {
  start: number;
  end: number;
} {
  let nextStart = start;
  let nextEnd = end;

  while (nextStart < nextEnd && isWhitespace(text[nextStart])) {
    nextStart += 1;
  }

  while (nextEnd > nextStart && isWhitespace(text[nextEnd - 1])) {
    nextEnd -= 1;
  }

  return { start: nextStart, end: nextEnd };
}

function normalizeOffsets(text: string, start: number, end: number): {
  start: number;
  end: number;
} | null {
  const trimmed = trimWhitespace(text, start, end);

  if (trimmed.start >= trimmed.end) {
    return null;
  }

  const tokens = getWordLikeTokens(text);
  const selectedTokens = tokens.filter((token) =>
    token.end > trimmed.start && token.start < trimmed.end
  );

  if (selectedTokens.length === 0) {
    return null;
  }

  const firstToken = selectedTokens[0];
  const lastToken = selectedTokens[selectedTokens.length - 1];
  let nextStart = trimmed.start;
  let nextEnd = trimmed.end;

  if (nextStart > firstToken.start && nextStart < firstToken.end) {
    nextStart = firstToken.start;
  }

  if (nextEnd > lastToken.start && nextEnd < lastToken.end) {
    const selectedPrefixLength = nextEnd - lastToken.start;
    const hasCompleteTokenBefore = selectedTokens
      .slice(0, -1)
      .some((token) => token.start >= nextStart && token.end <= nextEnd);

    nextEnd = hasCompleteTokenBefore && selectedPrefixLength <= 1
      ? lastToken.start
      : lastToken.end;
  }

  const normalized = trimWhitespace(text, nextStart, nextEnd);

  return normalized.start < normalized.end ? normalized : null;
}

export function snapSelectionRange(root: HTMLElement, sourceRange: Range): Range | null {
  if (
    sourceRange.collapsed ||
    !root.contains(sourceRange.startContainer) ||
    !root.contains(sourceRange.endContainer)
  ) {
    return null;
  }

  const text = root.textContent ?? '';
  const startOffset = getRangeOffset(root, sourceRange.startContainer, sourceRange.startOffset);
  const endOffset = getRangeOffset(root, sourceRange.endContainer, sourceRange.endOffset);
  const normalized = normalizeOffsets(
    text,
    Math.min(startOffset, endOffset),
    Math.max(startOffset, endOffset)
  );

  if (!normalized) {
    return null;
  }

  const segments = getTextSegments(root);
  const startPosition = getTextPositionAtOffset(segments, normalized.start, 'start');
  const endPosition = getTextPositionAtOffset(segments, normalized.end, 'end');

  if (!startPosition || !endPosition) {
    return null;
  }

  const range = document.createRange();
  range.setStart(startPosition.node, startPosition.offset);
  range.setEnd(endPosition.node, endPosition.offset);

  return range.toString().trim() ? range : null;
}
