import React, { useState } from 'react';
import { ComponentUsageReport } from './hooks/useComponentAudit';

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface ComponentAuditViewProps {
  space: Space;
  report: ComponentUsageReport[];
  status: string;
  onBack: () => void;
  onViewComponent: (componentName: string) => void;
}

export const ComponentAuditView: React.FC<ComponentAuditViewProps> = ({
  space,
  report,
  status,
  onBack,
  onViewComponent
}) => {
  const [showBuilderComponents, setShowBuilderComponents] = useState(false);

  const filteredComponents = report.filter(component => 
    showBuilderComponents || !component.componentName.startsWith('@builder.io')
  );

  return (
    <div className="admin-tools-container">
      <div className="admin-tools-max-width">
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: '16px' }}>
          <nav style={{ fontSize: '14px', color: '#6b7280' }}>
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
              Admin Tools
            </button>
            <span style={{ margin: '0 8px' }}>→</span>
            <span style={{ color: '#374151', fontWeight: 500 }}>Component Audit Report</span>
          </nav>
        </div>

        {/* Header */}
        <div className="admin-tools-header">
          <h1 className="admin-tools-title">Component Audit Report</h1>
          <p className="admin-tools-subtitle">Component usage analysis for <strong>{space.name}</strong></p>
        </div>
        
        {/* Report Card */}
        <div className="admin-tools-card">
          <div className="admin-tools-section">
            {/* Summary */}
            <div className="admin-tools-section-spacing">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="admin-tools-section-title">Component Usage Summary</h2>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {filteredComponents.length} unique components found
                  {!showBuilderComponents && report.some(c => c.componentName.startsWith('@builder.io')) && (
                    <span style={{ fontSize: '12px', color: '#9ca3af', display: 'block' }}>
                      ({report.filter(c => c.componentName.startsWith('@builder.io')).length} Builder.io core components hidden)
                    </span>
                  )}
                </div>
              </div>
              
              {/* Filter Controls */}
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                  Component Filter
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="radio"
                      name="componentFilter"
                      checked={!showBuilderComponents}
                      onChange={() => setShowBuilderComponents(false)}
                      style={{ marginRight: '6px' }}
                    />
                    Hide Builder.io core components
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                    <input
                      type="radio"
                      name="componentFilter"
                      checked={showBuilderComponents}
                      onChange={() => setShowBuilderComponents(true)}
                      style={{ marginRight: '6px' }}
                    />
                    Show all components
                  </label>
                </div>
              </div>
            </div>

            {/* Components Table */}
            {filteredComponents.length > 0 ? (
              <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 120px',
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  borderBottom: '1px solid #e5e7eb',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.025em'
                }}>
                  <div>Component Name</div>
                  <div>Usage Count</div>
                  <div>View Details</div>
                </div>

                {/* Table Body */}
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {filteredComponents.map((component) => (
                    <div
                      key={component.componentName}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 120px',
                        padding: '12px 16px',
                        borderBottom: '1px solid #f3f4f6',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          fontWeight: 500, 
                          color: '#111827',
                          fontSize: '14px'
                        }}>
                          {component.componentName}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '14px',
                          color: '#374151',
                          fontWeight: 500
                        }}>
                          {component.usageCount}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button
                          onClick={() => onViewComponent(component.componentName)}
                          className="admin-tools-button-secondary"
                          style={{ 
                            fontSize: '12px', 
                            padding: '6px 12px'
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                No components found in the analyzed pages.
              </div>
            )}

            {/* Action Buttons */}
            <div className="admin-tools-border-top" style={{ marginTop: '16px' }}>
              <button
                onClick={onBack}
                className="admin-tools-button-secondary"
              >
                ← Back to Features
              </button>
            </div>
          </div>
        </div>

        {/* Status Section */}
        {status && (
          <div className={`admin-tools-status ${
            status.startsWith("Error") 
              ? "admin-tools-status-error"
              : status.includes("completed") || status.includes("Successfully")
              ? "admin-tools-status-success"
              : "admin-tools-status-info"
          }`}>
            <div className="admin-tools-status-icon">
              {status.startsWith("Error") ? "⚠️" : status.includes("completed") || status.includes("Successfully") ? "✅" : "ℹ️"}
            </div>
            <div>
              <p style={{ fontWeight: 500 }}>{status}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};