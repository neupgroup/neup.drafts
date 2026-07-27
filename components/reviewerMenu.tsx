import type { ReactNode } from 'react';
import { BaseMenu, type BaseMenuPosition } from './baseMenu';

interface ReviewerMenuProps {
  children?: ReactNode;
  position: BaseMenuPosition;
}

export function ReviewerMenu({ children, position }: ReviewerMenuProps) {
  return (
    <BaseMenu
      ariaLabel="Reviewer menu"
      dataAttribute="data-reviewer-menu"
      position={position}
    >
      {children}
    </BaseMenu>
  );
}
