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
      <select
        value={selectedFeature}
        onChange={(e) => onFeatureChange(e.target.value)}
        className="admin-tools-select"
      >
        <option value="">Select a feature...</option>
        <option value="modelSync">Model Synchronization</option>
        <option value="contentPurger">Content Purger</option>
      </select>
    </div>
  );
};