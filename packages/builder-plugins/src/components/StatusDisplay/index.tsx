import React from "react";

interface StatusDisplayProps {
  status: string;
  debugInfo?: any[];
  showDebug?: boolean;
  onToggleDebug?: () => void;
  onClearDebug?: () => void;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ 
  status, 
  debugInfo = [],
  showDebug = false,
  onToggleDebug,
  onClearDebug
}) => {
  return (
    <>
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

      {/* Debug Panel */}
      {(debugInfo.length > 0 || onToggleDebug) && (
        <div className="admin-tools-card" style={{ marginTop: '1.5rem' }}>
          <div className="admin-tools-section" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Debug Information</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onToggleDebug && (
                  <button
                    onClick={onToggleDebug}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug
                  </button>
                )}
                {onClearDebug && (
                  <button
                    onClick={onClearDebug}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            
            {showDebug && (
              <div style={{ 
                maxHeight: '300px', 
                overflowY: 'auto', 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                padding: '12px'
              }}>
                {debugInfo.length === 0 ? (
                  <p style={{ color: '#6b7280', fontStyle: 'italic', margin: 0 }}>No debug information yet</p>
                ) : (
                  debugInfo.map((log, index) => (
                    <div key={index} style={{ 
                      marginBottom: '12px', 
                      paddingBottom: '8px', 
                      borderBottom: index < debugInfo.length - 1 ? '1px solid #e9ecef' : 'none'
                    }}>
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#6b7280', 
                        marginBottom: '4px' 
                      }}>
                        {log.timestamp}
                      </div>
                      <div style={{ 
                        fontSize: '13px', 
                        fontWeight: 500, 
                        color: log.level === 'error' ? '#dc2626' : log.level === 'warning' ? '#d97706' : '#111827',
                        marginBottom: '4px' 
                      }}>
                        {log.message}
                      </div>
                      {log.data && (
                        <pre style={{ 
                          fontSize: '11px', 
                          color: '#374151',
                          backgroundColor: 'white',
                          padding: '8px',
                          borderRadius: '3px',
                          margin: 0,
                          overflow: 'auto',
                          maxHeight: '150px'
                        }}>
                          {log.data}
                        </pre>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};