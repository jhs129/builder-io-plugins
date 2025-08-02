import React from 'react';
import { Model } from './hooks/useAdminApi';

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface ModelSelectionProps {
  spaces: Space[];
  selectedSpaceIndex: number;
  availableModels: Model[];
  selectedModels: Set<string>;
  running: boolean;
  status: string;
  onBack: () => void;
  onToggleModel: (modelId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onExport: () => void;
  onMigrate: () => void;
}

export const ModelSelection: React.FC<ModelSelectionProps> = ({
  spaces,
  selectedSpaceIndex,
  availableModels,
  selectedModels,
  running,
  status,
  onBack,
  onToggleModel,
  onSelectAll,
  onDeselectAll,
  onExport,
  onMigrate
}) => {
  return (
    <div className="admin-tools-container">
      <div className="admin-tools-max-width">
        {/* Header */}
        <div className="admin-tools-header">
          <h1 className="admin-tools-title">Model Selection</h1>
          <p className="admin-tools-subtitle">Choose which models to synchronize from <strong>{spaces[selectedSpaceIndex].name}</strong></p>
        </div>
        
        {/* Model Selection Card */}
        <div className="admin-tools-card">
          <div className="admin-tools-section">
            {/* Controls */}
            <div className="admin-tools-section-spacing">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {selectedModels.size} of {availableModels.length} models selected
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={onSelectAll}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Select All
                  </button>
                  <button
                    onClick={onDeselectAll}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Models Table */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 200px 120px',
                padding: '12px 16px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}>
                <div></div>
                <div>Name</div>
                <div>Unique Identifier</div>
                <div>Type</div>
              </div>

              {/* Table Body */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {availableModels.map((model, index) => (
                  <div
                    key={model.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 200px 120px',
                      padding: '12px 16px',
                      borderBottom: index < availableModels.length - 1 ? '1px solid #f3f4f6' : 'none',
                      cursor: 'pointer',
                      backgroundColor: selectedModels.has(model.id) ? '#f0f9ff' : 'white',
                      transition: 'background-color 0.15s ease'
                    }}
                    onClick={() => onToggleModel(model.id)}
                    onMouseEnter={(e) => {
                      if (!selectedModels.has(model.id)) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedModels.has(model.id)) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedModels.has(model.id)}
                        onChange={() => onToggleModel(model.id)}
                        style={{ cursor: 'pointer', margin: 0 }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        fontWeight: 500, 
                        color: '#111827',
                        fontSize: '14px'
                      }}>
                        {model.name}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: '13px',
                      color: '#6b7280',
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace'
                    }}>
                      {model.id}
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        backgroundColor: model.kind === 'page' ? '#dbeafe' : 
                                       model.kind === 'section' ? '#fef3c7' : 
                                       model.kind === 'data' ? '#f3e8ff' : '#f1f5f9',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 500,
                        textTransform: 'capitalize'
                      }}>
                        {model.kind}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="admin-tools-border-top" style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                <button
                  onClick={onBack}
                  className="admin-tools-button-secondary"
                  disabled={running}
                >
                  ← Back
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={onExport}
                    disabled={running || selectedModels.size === 0}
                    className="admin-tools-button-secondary"
                  >
                    {running ? (
                      <>
                        <div className="admin-tools-spinner"></div>
                        Exporting...
                      </>
                    ) : (
                      `Export ${selectedModels.size} as JSON`
                    )}
                  </button>
                  <button
                    onClick={onMigrate}
                    disabled={running || selectedModels.size === 0}
                    className="admin-tools-button"
                  >
                    {running ? (
                      <>
                        <div className="admin-tools-spinner"></div>
                        Loading...
                      </>
                    ) : (
                      `Migrate ${selectedModels.size} Model${selectedModels.size !== 1 ? 's' : ''}`
                    )}
                  </button>
                </div>
              </div>
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