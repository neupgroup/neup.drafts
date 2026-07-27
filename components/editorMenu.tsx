import {
  BaseMenu,
  BaseMenuButton,
  BaseMenuSeparator,
  type BaseMenuPosition,
} from './baseMenu';
import {
  calloutBlockMetadata,
  calloutBlockTypes,
  type CalloutBlockType,
} from './calloutBlock';

export type EditorMenuAction =
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'callout'
  | 'bold'
  | 'italic'
  | 'underline'
  | 'highlight'
  | 'link';

interface EditorMenuProps {
  activeActions?: EditorMenuAction[];
  activeCalloutType?: CalloutBlockType;
  mode?: 'default' | 'callout';
  onAction: (action: EditorMenuAction) => void;
  onBack?: () => void;
  onCalloutTypeChange?: (type: CalloutBlockType) => void;
  position: BaseMenuPosition;
  showHeadingActions?: boolean;
}

export function EditorMenu({
  activeActions = [],
  activeCalloutType = 'informative',
  mode = 'default',
  onAction,
  onBack,
  onCalloutTypeChange,
  position,
  showHeadingActions = true,
}: EditorMenuProps) {
  if (mode === 'callout') {
    return (
      <BaseMenu
        ariaLabel="Callout block menu"
        dataAttribute="data-selection-menu"
        position={position}
      >
        <BaseMenuButton
          aria-label="Back"
          title="Back"
          onClick={onBack}
          className="text-lg font-bold"
        >
          &#8592;
        </BaseMenuButton>

        <BaseMenuSeparator />

        {calloutBlockTypes.map((type) => (
          <BaseMenuButton
            key={type}
            active={activeCalloutType === type}
            aria-label={`${calloutBlockMetadata[type].label} callout`}
            title={calloutBlockMetadata[type].label}
            onClick={() => onCalloutTypeChange?.(type)}
            className="text-lg font-bold"
          >
            {calloutBlockMetadata[type].icon}
          </BaseMenuButton>
        ))}
      </BaseMenu>
    );
  }

  return (
    <BaseMenu
      ariaLabel="Editor selection menu"
      dataAttribute="data-selection-menu"
      position={position}
    >
      {showHeadingActions && (
        <>
          <BaseMenuButton
            active={activeActions.includes('h2')}
            aria-label="Heading 2"
            title="Heading 2"
            onClick={() => onAction('h2')}
            className="text-sm font-bold"
          >
            H2
          </BaseMenuButton>

          <BaseMenuButton
            active={activeActions.includes('h3')}
            aria-label="Heading 3"
            title="Heading 3"
            onClick={() => onAction('h3')}
            className="text-sm font-bold"
          >
            H3
          </BaseMenuButton>
        </>
      )}

      <BaseMenuButton
        active={activeActions.includes('paragraph')}
        aria-label="Paragraph"
        title="Paragraph"
        onClick={() => onAction('paragraph')}
        className="text-sm font-bold"
      >
        P
      </BaseMenuButton>

      <BaseMenuSeparator />

      <BaseMenuButton
        active={activeActions.includes('bold')}
        aria-label="Bold"
        title="Bold"
        onClick={() => onAction('bold')}
        className="text-lg font-bold"
      >
        B
      </BaseMenuButton>

      <BaseMenuButton
        active={activeActions.includes('italic')}
        aria-label="Italic"
        title="Italic"
        onClick={() => onAction('italic')}
        className="font-serif text-xl font-bold italic"
      >
        i
      </BaseMenuButton>

      <BaseMenuButton
        active={activeActions.includes('underline')}
        aria-label="Underline"
        title="Underline"
        onClick={() => onAction('underline')}
        className="text-lg font-bold underline underline-offset-4"
      >
        U
      </BaseMenuButton>

      <BaseMenuButton
        active={activeActions.includes('highlight')}
        aria-label="Highlight"
        title="Highlight"
        onClick={() => onAction('highlight')}
        className="text-lg font-bold"
      >
        H
      </BaseMenuButton>

      <BaseMenuButton
        active={activeActions.includes('link')}
        aria-label="Add link"
        title="Add link"
        onClick={() => onAction('link')}
        className="text-lg font-bold"
      >
        &#8599;
      </BaseMenuButton>

      <BaseMenuSeparator />

      <BaseMenuButton
        active={activeActions.includes('callout')}
        aria-label="Callout"
        title="Callout"
        onClick={() => onAction('callout')}
        className="text-sm font-bold"
      >
        C
      </BaseMenuButton>
    </BaseMenu>
  );
}
