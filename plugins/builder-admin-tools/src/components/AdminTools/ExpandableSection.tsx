import React, { useState } from 'react';

interface ExpandableSectionProps {
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  children: React.ReactNode;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
  isExpanded = false,
  onToggle,
  children
}) => {
  // Debug logging
  React.useEffect(() => {
    console.log('ExpandableSection: isExpanded prop is:', isExpanded);
  }, [isExpanded]);

  return (
    <div 
      style={{ 
        display: isExpanded ? 'block' : 'none',
        backgroundColor: '#f8f9fa',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      {children}
    </div>
  );
};