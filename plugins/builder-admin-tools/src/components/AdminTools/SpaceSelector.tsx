import React from "react";

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
  return (
    <div>
      <select
        value={selectedSpaceIndex}
        onChange={(e) => onSpaceChange(parseInt(e.target.value))}
        className="admin-tools-select"
      >
        <option value={-1}>Select a space...</option>
        {spaces.map((space, index) => (
          <option key={index} value={index}>
            {space.name}
          </option>
        ))}
      </select>
    </div>
  );
};