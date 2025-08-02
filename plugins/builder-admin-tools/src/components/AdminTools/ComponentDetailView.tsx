import React from 'react';
import { ComponentUsageReport } from './hooks/useComponentAudit';

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface ComponentDetailViewProps {
  space: Space;
  component: ComponentUsageReport;
  onBack: () => void;
  onBackToMain: () => void;
}

export const ComponentDetailView: React.FC<ComponentDetailViewProps> = ({
  space,
  component,
  onBack,
  onBackToMain
}) => {
  return (
    <div className="admin-tools-container">
      <div className="admin-tools-max-width">
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '16px' }}>
          <nav style={{ fontSize: '14px', color: '#6b7280' }}>
            <button
              onClick={onBackToMain}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px',
                padding: 0
              }}
            >
              Admin Tools
            </button>
            <span style={{ margin: '0 8px' }}>→</span>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px',
                padding: 0
              }}
            >
              Component Audit Report
            </button>
            <span style={{ margin: '0 8px' }}>→</span>
            <span style={{ color: '#374151', fontWeight: 500 }}>{component.componentName}</span>
          </nav>
        </div>

        {/* Header */}
        <div className="admin-tools-header">
          <h1 className="admin-tools-title">{component.componentName}</h1>
          <p className="admin-tools-subtitle">
            Component usage details for <strong>{space.name}</strong> • Used {component.usageCount} time{component.usageCount !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Component Details Card */}
        <div className="admin-tools-card">
          <div className="admin-tools-section">
            <div className="admin-tools-section-spacing">
              <h2 className="admin-tools-section-title">Pages Using This Component</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                This component is used on {component.pages.length} page{component.pages.length !== 1 ? 's' : ''} in your {space.name} space.
              </p>
            </div>

            {/* Pages List */}
            {component.pages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {component.pages.map((page) => (
                  <div key={page.id} style={{ 
                    padding: '16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <a
                        href={page.editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          fontSize: '16px', 
                          color: '#3b82f6',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {page.name}
                      </a>
                      {page.lastPreviewUrl && (
                        <a
                          href={page.lastPreviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ 
                            fontSize: '14px', 
                            color: '#059669',
                            textDecoration: 'none'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                        >
                          (Preview)
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                No pages found using this component.
              </div>
            )}

            {/* Back Button */}
            <div className="admin-tools-border-top" style={{ marginTop: '24px' }}>
              <button
                onClick={onBack}
                className="admin-tools-button-secondary"
              >
                Back to Component Audit Report →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};