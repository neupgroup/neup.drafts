import {
  BaseMenu,
  BaseMenuButton,
  type BaseMenuPosition,
} from './baseMenu';
import {
  calloutBlockMetadata,
  calloutBlockTypes,
  type CalloutBlockType,
} from './calloutBlock';

interface CalloutMenuProps {
  activeType: CalloutBlockType;
  onTypeChange: (type: CalloutBlockType) => void;
  position: BaseMenuPosition;
}

export function CalloutMenu({
  activeType,
  onTypeChange,
  position,
}: CalloutMenuProps) {
  return (
    <BaseMenu
      ariaLabel="Callout block menu"
      dataAttribute="data-callout-menu"
      position={position}
    >
      {calloutBlockTypes.map((type) => (
        <BaseMenuButton
          key={type}
          active={activeType === type}
          aria-label={`${calloutBlockMetadata[type].label} callout`}
          title={calloutBlockMetadata[type].label}
          onClick={() => onTypeChange(type)}
          className="text-lg font-bold"
        >
          {calloutBlockMetadata[type].icon}
        </BaseMenuButton>
      ))}
    </BaseMenu>
  );
}
