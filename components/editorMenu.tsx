import {
  BaseMenu,
  BaseMenuButton,
  type BaseMenuPosition,
} from './baseMenu';

export type EditorMenuAction = 'bold' | 'italic' | 'underline' | 'highlight' | 'link';

interface EditorMenuProps {
  activeActions?: EditorMenuAction[];
  onAction: (action: EditorMenuAction) => void;
  position: BaseMenuPosition;
}

export function EditorMenu({
  activeActions = [],
  onAction,
  position,
}: EditorMenuProps) {
  return (
    <BaseMenu
      ariaLabel="Editor selection menu"
      dataAttribute="data-selection-menu"
      position={position}
    >
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
    </BaseMenu>
  );
}
