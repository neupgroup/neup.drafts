import {
  BaseMenu,
  BaseMenuOption,
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
      orientation="vertical"
      position={position}
    >
      {calloutBlockTypes.map((type) => (
        <BaseMenuOption
          key={type}
          active={activeType === type}
          description={calloutBlockMetadata[type].description}
          icon={calloutBlockMetadata[type].icon}
          title={calloutBlockMetadata[type].label}
          onClick={() => onTypeChange(type)}
        />
      ))}
    </BaseMenu>
  );
}
