import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

export interface BaseMenuPosition {
  top: number;
  left: number;
  transform?: string;
}

interface BaseMenuProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
  dataAttribute?: string;
  orientation?: 'horizontal' | 'vertical';
  position: BaseMenuPosition;
}

interface BaseMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function BaseMenu({
  ariaLabel,
  children,
  className = '',
  dataAttribute,
  orientation = 'horizontal',
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
      className={`absolute z-40 flex max-w-[calc(100vw-1rem)] rounded-md bg-slate-950 text-white shadow-xl ${
        orientation === 'horizontal'
          ? 'h-11 items-center gap-1 overflow-x-auto px-2'
          : 'w-72 flex-col gap-1 p-2'
      } ${className}`}
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

export function BaseMenuSeparator() {
  return <span className="mx-1 h-6 w-px bg-white/20" aria-hidden="true" />;
}

interface BaseMenuOptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  description: string;
  icon: string;
  title: string;
}

export function BaseMenuOption({
  active = false,
  description,
  icon,
  onMouseDown,
  title,
  type = 'button',
  ...props
}: BaseMenuOptionProps) {
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
      className={`flex w-full items-start gap-3 rounded px-3 py-2 text-left transition-colors ${
        active
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-white hover:bg-white/10'
      }`}
    >
      <span className="grid size-7 shrink-0 place-items-center rounded bg-white/10 text-sm font-bold">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold leading-5">{title}</span>
        <span className={`block text-xs leading-4 ${active ? 'text-slate-600' : 'text-slate-300'}`}>
          {description}
        </span>
      </span>
    </button>
  );
}
