import {
  BaseMenu,
  BaseMenuOption,
  type BaseMenuPosition,
} from './baseMenu';

export type CalloutMenuType = 'informative' | 'warning' | 'error' | 'caution';

interface CalloutMenuProps {
  activeType: CalloutMenuType;
  onTypeChange: (type: CalloutMenuType) => void;
  position: BaseMenuPosition;
}

const calloutOptions: Array<{
  description: string;
  icon: string;
  title: string;
  type: CalloutMenuType;
}> = [
  {
    type: 'informative',
    icon: 'i',
    title: 'Informative',
    description: 'Neutral context, notes, and useful background.',
  },
  {
    type: 'warning',
    icon: '!',
    title: 'Warning',
    description: 'Important risk or condition to notice before acting.',
  },
  {
    type: 'error',
    icon: 'x',
    title: 'Error',
    description: 'Critical failure, blocker, or destructive outcome.',
  },
  {
    type: 'caution',
    icon: '?',
    title: 'Caution',
    description: 'Careful guidance for ambiguous or sensitive steps.',
  },
];

export function CalloutMenu({
  activeType,
  onTypeChange,
  position,
}: CalloutMenuProps) {
  return (
    <BaseMenu
      ariaLabel="Callout block menu"
      dataAttribute="data-callout-menu"
      orientation="vertical"
      position={position}
    >
      {calloutOptions.map((option) => (
        <BaseMenuOption
          key={option.type}
          active={activeType === option.type}
          description={option.description}
          icon={option.icon}
          title={option.title}
          onClick={() => onTypeChange(option.type)}
        />
      ))}
    </BaseMenu>
  );
}
