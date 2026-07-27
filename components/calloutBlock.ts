export type CalloutBlockType = 'informative' | 'warning' | 'error' | 'caution';

export const calloutBlockTypes: CalloutBlockType[] = [
  'informative',
  'warning',
  'error',
  'caution',
];

export const calloutBlockMetadata: Record<CalloutBlockType, {
  description: string;
  icon: string;
  label: string;
}> = {
  informative: {
    icon: 'i',
    label: 'Informative',
    description: 'Neutral context, notes, and useful background.',
  },
  warning: {
    icon: '!',
    label: 'Warning',
    description: 'Important risk or condition to notice before acting.',
  },
  error: {
    icon: 'x',
    label: 'Error',
    description: 'Critical failure, blocker, or destructive outcome.',
  },
  caution: {
    icon: '?',
    label: 'Caution',
    description: 'Careful guidance for ambiguous or sensitive steps.',
  },
};

export function isCalloutBlockType(value: string | undefined): value is CalloutBlockType {
  return value === 'informative' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'caution';
}

export function setCalloutBlockType(block: HTMLElement, calloutType: CalloutBlockType) {
  const metadata = calloutBlockMetadata[calloutType];

  block.dataset.editorBlock = 'callout';
  block.dataset.calloutType = calloutType;
  block.dataset.calloutIcon = metadata.icon;
  block.dataset.calloutLabel = metadata.label;
  block.dataset.calloutDescription = metadata.description;
  block.setAttribute('role', 'note');
}

export function createCalloutBlock(
  html = '<br>',
  calloutType: CalloutBlockType = 'informative'
): HTMLElement {
  const block = document.createElement('aside');

  block.innerHTML = html || '<br>';
  setCalloutBlockType(block, calloutType);

  return block;
}
