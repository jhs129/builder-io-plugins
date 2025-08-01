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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Space
      </label>
      <select
        value={selectedSpaceIndex}
        onChange={(e) => onSpaceChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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