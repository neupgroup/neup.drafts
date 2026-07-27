import type { ReactNode } from 'react';
import { BaseMenu, type BaseMenuPosition } from './baseMenu';

interface ViewerMenuProps {
  children?: ReactNode;
  position: BaseMenuPosition;
}

export function ViewerMenu({ children, position }: ViewerMenuProps) {
  return (
    <BaseMenu
      ariaLabel="Viewer menu"
      dataAttribute="data-viewer-menu"
      position={position}
    >
      {children}
    </BaseMenu>
  );
}
