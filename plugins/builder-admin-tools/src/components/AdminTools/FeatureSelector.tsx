import React from "react";

interface FeatureSelectorProps {
  selectedFeature: string;
  onFeatureChange: (feature: string) => void;
  isVisible: boolean;
}

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({
  selectedFeature,
  onFeatureChange,
  isVisible,
}) => {
  if (!isVisible) return null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Feature
      </label>
      <select
        value={selectedFeature}
        onChange={(e) => onFeatureChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select a feature...</option>
        <option value="modelSync">Model Synchronization</option>
        <option value="contentPurger">Content Purger</option>
      </select>
    </div>
  );
};