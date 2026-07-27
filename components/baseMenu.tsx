import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export interface BaseMenuPosition {
  top: number;
  left: number;
  transform?: string;
}

interface BaseMenuProps {
  ariaLabel: string;
  children: ReactNode;
  dataAttribute?: string;
  position: BaseMenuPosition;
}

interface BaseMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function BaseMenu({
  ariaLabel,
  children,
  dataAttribute,
  position,
}: BaseMenuProps) {
  const style: CSSProperties = {
    top: position.top,
    left: position.left,
    transform: position.transform,
  };
  const dataProps = dataAttribute ? { [dataAttribute]: true } : {};

  return (
    <div
      {...dataProps}
      role="toolbar"
      aria-label={ariaLabel}
      style={style}
      className="fixed z-50 flex h-11 items-center gap-1 rounded-md bg-slate-950 px-2 text-white shadow-xl"
    >
      {children}
      <span className="absolute left-1/2 top-full h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-slate-950" />
    </div>
  );
}

export function BaseMenuButton({
  active = false,
  children,
  className = '',
  onMouseDown,
  type = 'button',
  ...props
}: BaseMenuButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-pressed={active}
      data-active={active ? 'true' : undefined}
      onMouseDown={(event) => {
        event.preventDefault();
        onMouseDown?.(event);
      }}
      className={`grid size-8 place-items-center rounded leading-none transition-colors ${
        active
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-white hover:bg-white/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}
