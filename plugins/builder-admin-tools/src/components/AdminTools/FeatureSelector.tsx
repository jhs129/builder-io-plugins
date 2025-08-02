import React from 'react';

const styles = `
  .feature-selector-container {
    display: flex;
    flex-direction: row;
    gap: 1rem;
  }
  
  .feature-selector-button {
    padding: 8px 16px;
    border-radius: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    cursor: pointer;
    font-size: 14px;
    background-color: #3b82f6;
    color: white;
    border: 2px solid #3b82f6;
  }
  
  .feature-selector-button:hover {
    background-color: #f3f4f6;
    color: #374151;
    border: 2px solid #d1d5db;
  }
  
  .feature-selector-button-selected {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
`;

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
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="feature-selector-container">
        <button
          onClick={() => onFeatureChange('modelSync')}
          className={`admin-tools-button feature-selector-button ${
            selectedFeature === 'modelSync'
              ? 'feature-selector-button-selected'
              : ''
          }`}
        >
          Model Synchronization
        </button>
        <button
          onClick={() => onFeatureChange('contentPurger')}
          className={`admin-tools-button feature-selector-button ${
            selectedFeature === 'contentPurger'
              ? 'feature-selector-button-selected'
              : ''
          }`}
        >
          Content Purger
        </button>
        <button
          onClick={() => onFeatureChange('componentAudit')}
          className={`admin-tools-button feature-selector-button ${
            selectedFeature === 'componentAudit'
              ? 'feature-selector-button-selected'
              : ''
          }`}
        >
          Component Audit
        </button>
      </div>
    </>
  );
};
