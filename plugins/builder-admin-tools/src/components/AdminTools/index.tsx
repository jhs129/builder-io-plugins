import React, { useState, useEffect } from "react";
import appState from "@builder.io/app-context";
import { pluginId } from "../../utils";
import { ConfigurationStatus } from "./ConfigurationStatus";
import { SpaceSelector } from "./SpaceSelector";
import { FeatureSelector } from "./FeatureSelector";

export interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

const AdminToolsPlugin = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number>(-1);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      const pluginSettings = appState?.user?.organization?.value?.settings?.plugins?.get?.(pluginId);
      
      if (!pluginSettings) {
        setStatus("Plugin settings not found. Please configure the plugin first.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      // Try to get spaces configuration
      let spacesConfig;
      try {
        spacesConfig = pluginSettings.get ? pluginSettings.get("spaces") : pluginSettings.spaces;
      } catch (error) {
        console.warn("Error accessing spaces config:", error);
        setStatus("Please configure your spaces in the plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      if (!spacesConfig) {
        setStatus("Please configure your spaces in the plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      // Get the space array and properly extract data from MobX observables
      let spaceArray = [];
      try {
        if (spacesConfig.space) {
          spaceArray = spacesConfig.space;
        } else if (spacesConfig.get) {
          spaceArray = spacesConfig.get("space") || [];
        }
      } catch (error) {
        console.warn("Error accessing space array:", error);
        setStatus("Error accessing space configuration. Please check your plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      if (!Array.isArray(spaceArray) || spaceArray.length === 0) {
        setStatus("Please add at least one space in the plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      // Convert MobX observables to plain objects
      const plainSpaces = spaceArray.map((space: any) => {
        try {
          // If it's a MobX observable, extract the values
          if (space && typeof space === 'object' && space.get) {
            return {
              name: space.get('name') || 'Unnamed Space',
              publicKey: space.get('publicKey') || '',
              privateKey: space.get('privateKey') || ''
            };
          } else if (space && typeof space === 'object') {
            // If it's already a plain object
            return {
              name: space.name || 'Unnamed Space',
              publicKey: space.publicKey || '',
              privateKey: space.privateKey || ''
            };
          } else {
            // Fallback
            return {
              name: 'Invalid Space',
              publicKey: '',
              privateKey: ''
            };
          }
        } catch (error) {
          console.warn("Error extracting space data:", error);
          return {
            name: 'Error Loading Space',
            publicKey: '',
            privateKey: ''
          };
        }
      });

      console.log("Extracted spaces:", plainSpaces);
      setSpaces(plainSpaces);
      setStatus("");
      setLoading(false);
    } catch (error) {
      console.error("Error loading plugin settings:", error);
      setStatus("Error loading plugin settings. Please check configuration.");
      setSpaces([]);
      setLoading(false);
    }
  }, []);

  const handleRunFeature = async () => {
    if (!selectedFeature || selectedSpaceIndex < 0) return;
    
    setRunning(true);
    setStatus("Running...");
    
    try {
      const space = spaces[selectedSpaceIndex];
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus(`${selectedFeature} completed successfully for space: ${space.name}`);
    } catch (error) {
      setStatus(`Error running ${selectedFeature}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-tools-container">
        <div className="admin-tools-max-width">
          <div className="admin-tools-card">
            <div className="admin-tools-section">
              <div className="admin-tools-loading-container">
                <div className="admin-tools-loading-spinner"></div>
                <span style={{ color: '#6b7280' }}>Loading configuration...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (spaces.length === 0) {
    return (
      <div className="admin-tools-container">
        <div className="admin-tools-max-width">
          <ConfigurationStatus status={status} />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-tools-container">
      <div className="admin-tools-max-width">
        {/* Header */}
        <div className="admin-tools-header">
          <h1 className="admin-tools-title">Builder.io Admin Tools</h1>
          <p className="admin-tools-subtitle">Manage your Builder.io spaces and content with powerful admin features.</p>
        </div>
        
        {/* Main Card */}
        <div className="admin-tools-card">
          <div className="admin-tools-section">
            {/* Space Selection Section */}
            <div className="admin-tools-section-spacing">
              <h2 className="admin-tools-section-title">Select Space</h2>
              <SpaceSelector
                spaces={spaces}
                selectedSpaceIndex={selectedSpaceIndex}
                onSpaceChange={setSelectedSpaceIndex}
              />
            </div>

            {/* Feature Selection Section */}
            {selectedSpaceIndex >= 0 && (
              <div className="admin-tools-section-spacing">
                <h2 className="admin-tools-section-title">Choose Feature</h2>
                <FeatureSelector
                  selectedFeature={selectedFeature}
                  onFeatureChange={setSelectedFeature}
                  isVisible={selectedSpaceIndex >= 0}
                />
              </div>
            )}

            {/* Action Section */}
            {selectedSpaceIndex >= 0 && selectedFeature && (
              <div className="admin-tools-border-top">
                <div className="admin-tools-exec-header">
                  <div>
                    <h3 className="admin-tools-exec-title">Ready to Execute</h3>
                    <p className="admin-tools-exec-desc">
                      Running <strong>{selectedFeature}</strong> on{' '}
                      <strong>{spaces[selectedSpaceIndex].name}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunFeature}
                  disabled={running}
                  className="admin-tools-button"
                >
                  {running ? (
                    <>
                      <div className="admin-tools-spinner"></div>
                      Running...
                    </>
                  ) : (
                    "Run Feature"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        {status && (
          <div className={`admin-tools-status ${
            status.startsWith("Error") 
              ? "admin-tools-status-error"
              : status.includes("completed")
              ? "admin-tools-status-success"
              : "admin-tools-status-info"
          }`}>
            <div className="admin-tools-status-icon">
              {status.startsWith("Error") ? "⚠️" : status.includes("completed") ? "✅" : "ℹ️"}
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

export default AdminToolsPlugin;