import React from "react";
import { CustomSelect } from "builder-plugins";

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface SpaceSelectorProps {
  spaces: Space[];
  selectedSpaceIndex: number;
  onSpaceChange: (index: number) => void;
}

export const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  spaces,
  selectedSpaceIndex,
  onSpaceChange,
}) => {
  const options = [
    { value: -1, label: "Select a space..." },
    ...spaces.map((space, index) => ({
      value: index,
      label: space.name,
    })),
  ];

  return (
    <div>
      <CustomSelect
        options={options}
        value={selectedSpaceIndex}
        onChange={onSpaceChange}
        placeholder="Select a space..."
      />
    </div>
  );
};