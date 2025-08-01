import React from "react";

interface ConfigurationStatusProps {
  status: string;
}

export const ConfigurationStatus: React.FC<ConfigurationStatusProps> = ({ status }) => {
  return (
    <div className="admin-tools-card">
      <div className="admin-tools-section">
        <div className="admin-tools-config-container">
          <div className="admin-tools-config-icon">
            ⚙️
          </div>
          <h2 className="admin-tools-config-title">Configuration Required</h2>
          <div className="admin-tools-config-content">
            <p className="admin-tools-config-text">
              {status || "Please configure the plugin settings to get started."}
            </p>
            <div className="admin-tools-config-steps">
              <h3 className="admin-tools-config-steps-title">Next Steps:</h3>
              <ul className="admin-tools-config-steps-list">
                <li className="admin-tools-config-steps-item">1. Go to the plugin settings</li>
                <li className="admin-tools-config-steps-item">2. Add your Builder.io spaces with:</li>
                <li className="admin-tools-config-steps-item indent">• Space name</li>
                <li className="admin-tools-config-steps-item indent">• Public API key</li>
                <li className="admin-tools-config-steps-item indent">• Private API key</li>
                <li className="admin-tools-config-steps-item">3. Save the configuration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};