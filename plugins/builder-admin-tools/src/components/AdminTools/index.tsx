import React, { useState, useEffect } from "react";
import appState from "@builder.io/app-context";
import { createAdminApiClient } from "@builder.io/admin-sdk";
import { pluginId } from "../../utils";
import { ConfigurationStatus } from "./ConfigurationStatus";
import { SpaceSelector } from "./SpaceSelector";
import { FeatureSelector } from "./FeatureSelector";

export interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

interface Model {
  id: string;
  name: string;
  kind: string;
  fields?: any[];
  helperText?: string;
  everything?: any;
}

const AdminToolsPlugin = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceIndex, setSelectedSpaceIndex] = useState<number>(-1);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [showMigrationTarget, setShowMigrationTarget] = useState(false);
  const [selectedTargetSpaceIndex, setSelectedTargetSpaceIndex] = useState<number>(-1);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addDebugLog = (message: string, data?: any, level: 'info' | 'warning' | 'error' = 'info') => {
    // Only log warnings and errors to reduce noise
    if (level === 'info') return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined,
      level
    };
    setDebugInfo(prev => [...prev, logEntry]);
    
    if (level === 'error') {
      console.error(`[AdminTools] ${timestamp}: ${message}`, data);
    } else if (level === 'warning') {
      console.warn(`[AdminTools] ${timestamp}: ${message}`, data);
    }
  };

  const clearDebugLog = () => {
    setDebugInfo([]);
  };

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
    
    const space = spaces[selectedSpaceIndex];

    switch (selectedFeature) {
      case "modelSync":
        await loadModelsForSelection(space);
        break;
      case "contentPurger":
        setRunning(true);
        setStatus("Initializing...");
        try {
          await runContentPurger(space);
          setStatus(`${selectedFeature} completed successfully for space: ${space.name}`);
        } catch (error) {
          console.error("Error running feature:", error);
          setStatus(`Error running ${selectedFeature}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setRunning(false);
        }
        break;
      default:
        setStatus("Unknown feature selected");
    }
  };

  const loadModelsForSelection = async (space: Space) => {
    setRunning(true);
    setStatus("Loading models from space...");
    
    try {
      const models = await getAvailableModels(space.privateKey);
      
      if (models.length === 0) {
        setStatus("No models found in selected space");
        setRunning(false);
        return;
      }

      setAvailableModels(models);
      setSelectedModels(new Set());
      setShowModelSelection(true);
      setStatus(`Found ${models.length} models. Select which models to export.`);
      setRunning(false);
    } catch (error) {
      console.error("Error loading models:", error);
      setStatus(`Error loading models: ${error instanceof Error ? error.message : String(error)}`);
      setRunning(false);
    }
  };

  const toggleModelSelection = (modelId: string) => {
    const newSelection = new Set(selectedModels);
    if (newSelection.has(modelId)) {
      newSelection.delete(modelId);
    } else {
      newSelection.add(modelId);
    }
    setSelectedModels(newSelection);
  };

  const selectAllModels = () => {
    const allModelIds = new Set(availableModels.map(model => model.id));
    setSelectedModels(allModelIds);
  };

  const deselectAllModels = () => {
    setSelectedModels(new Set());
  };

  const exportSelectedModels = async () => {
    if (selectedModels.size === 0) {
      setStatus("No models selected for export");
      return;
    }

    setRunning(true);
    setStatus("Preparing export...");

    try {
      const modelsToExport = availableModels.filter(model => selectedModels.has(model.id));
      const exportData = {
        exportedAt: new Date().toISOString(),
        sourceSpace: spaces[selectedSpaceIndex].name,
        models: modelsToExport
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `builder-models-export-${spaces[selectedSpaceIndex].name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus(`✅ Successfully exported ${selectedModels.size} models as JSON`);
    } catch (error) {
      console.error("Error exporting models:", error);
      setStatus(`Error exporting models: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  const backToFeatureSelection = () => {
    setShowModelSelection(false);
    setShowMigrationTarget(false);
    setAvailableModels([]);
    setSelectedModels(new Set());
    setSelectedTargetSpaceIndex(-1);
    setStatus("");
  };

  const backToModelSelection = () => {
    setShowMigrationTarget(false);
    setSelectedTargetSpaceIndex(-1);
    setStatus("");
  };

  const showMigrationTargetSelection = () => {
    if (selectedModels.size === 0) {
      setStatus("No models selected for migration");
      return;
    }

    setShowMigrationTarget(true);
    setStatus(`Select target space for migrating ${selectedModels.size} model${selectedModels.size !== 1 ? 's' : ''}`);
  };

  const migrateSelectedModels = async () => {
    if (selectedModels.size === 0 || selectedTargetSpaceIndex < 0) return;

    setRunning(true);
    setStatus("Starting migration...");

    try {
      const sourceSpace = spaces[selectedSpaceIndex];
      const targetSpace = spaces[selectedTargetSpaceIndex];
      const modelsToMigrate = availableModels.filter(model => selectedModels.has(model.id));


      // Check if target models already exist
      setStatus("Checking existing models in target space...");
      const targetModels = await getAvailableModels(targetSpace.privateKey);
      const existingModelNames = new Set(targetModels.map(m => m.name));

      let migratedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const model of modelsToMigrate) {
        const existsInTarget = existingModelNames.has(model.name);
        
        try {
          if (existsInTarget) {
            setStatus(`Updating "${model.name}" in ${targetSpace.name}... (${migratedCount + skippedCount + 1}/${modelsToMigrate.length})`);
            addDebugLog(`⚠️ Model "${model.name}" already exists - updating instead of creating`, undefined, 'warning');
          } else {
            setStatus(`Creating "${model.name}" in ${targetSpace.name}... (${migratedCount + skippedCount + 1}/${modelsToMigrate.length})`);
          }
          
          await createModelInSpace(model, targetSpace.privateKey);
          migratedCount++;
        } catch (error) {
          console.error(`Error ${existsInTarget ? 'updating' : 'creating'} model ${model.name}:`, error);
          addDebugLog(`❌ Failed to ${existsInTarget ? 'update' : 'create'} model: ${model.name}`, { 
            error: error instanceof Error ? error.message : String(error),
            model 
          }, 'error');
          errorCount++;
        }
      }

      // Final status
      if (errorCount === 0) {
        setStatus(`✅ Successfully processed ${migratedCount} models to ${targetSpace.name}`);
      } else {
        setStatus(`⚠️ Migration completed: ${migratedCount} processed, ${errorCount} errors`);
      }
    } catch (error) {
      console.error("Error during migration:", error);
      addDebugLog("❌ Migration failed", { error: error instanceof Error ? error.message : String(error) }, 'error');
      setStatus(`Error during migration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRunning(false);
    }
  };

  const runModelSync = async (sourceSpace: Space) => {
    setStatus("Fetching models from source space...");
    
    // Get available target spaces (all spaces except the source)
    const targetSpaces = spaces.filter(space => space.privateKey !== sourceSpace.privateKey);
    
    if (targetSpaces.length === 0) {
      throw new Error("Model sync requires at least one other space to be configured as a target");
    }
    
    // Get models from source space
    const sourceModels = await getAvailableModels(sourceSpace.privateKey);
    
    if (sourceModels.length === 0) {
      throw new Error("No models found in source space");
    }

    setStatus(`Found ${sourceModels.length} models. Starting synchronization...`);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    // Sync models to each target space
    for (const targetSpace of targetSpaces) {
      setStatus(`Syncing to ${targetSpace.name}... (${syncedCount}/${sourceModels.length * targetSpaces.length})`);
      
      try {
        // Get existing models in target space to avoid duplicates
        const targetModels = await getAvailableModels(targetSpace.privateKey);
        const targetModelNames = new Set(targetModels.map(m => m.name));
        
        // Sync each model
        for (const model of sourceModels) {
          if (targetModelNames.has(model.name)) {
            setStatus(`Skipping ${model.name} - already exists in ${targetSpace.name}`);
            continue;
          }
          
          setStatus(`Creating model "${model.name}" in ${targetSpace.name}...`);
          
          await createModelInSpace(model, targetSpace.privateKey);
          syncedCount++;
          
          setStatus(`Created ${model.name} in ${targetSpace.name} (${syncedCount}/${sourceModels.length * targetSpaces.length})`);
        }
      } catch (error) {
        console.error(`Error syncing to ${targetSpace.name}:`, error);
        errorCount++;
        setStatus(`Error syncing to ${targetSpace.name}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other spaces
      }
    }
    
    if (errorCount === 0) {
      setStatus(`✅ Successfully synced ${syncedCount} models to ${targetSpaces.length} target space(s)`);
    } else {
      setStatus(`⚠️ Sync completed with errors: ${syncedCount} models synced, ${errorCount} errors occurred`);
    }
  };

  const runContentPurger = async (space: Space) => {
    setStatus("Analyzing content in space...");
    
    const models = await getAvailableModels(space.privateKey);
    
    if (models.length === 0) {
      throw new Error("No models found in space");
    }

    setStatus(`Found ${models.length} models. Analyzing content...`);
    
    // For now, just show what would be analyzed
    const modelNames = models.map(m => m.name).join(', ');
    setStatus(`Would purge content from models [${modelNames}] in ${space.name}. (Implementation pending)`);
  };

  const getAvailableModels = async (privateApiKey: string): Promise<Model[]> => {
    try {
      const adminSDK = createAdminApiClient(privateApiKey);

      const response = await adminSDK.query({
        models: {
          id: true,
          name: true,
          kind: true,
          fields: true,
          helperText: true,
          everything: true
        }
      });

      const models = (response.data?.models || []).map((model: any) => ({
        id: model.id || "",
        name: model.name || "",
        kind: model.kind || "",
        fields: model.fields || [],
        helperText: model.helperText || "",
        everything: model.everything || {}
      }));
      
      return models;
    } catch (error) {
      addDebugLog("❌ Failed to fetch models from space", { 
        error: error instanceof Error ? error.message : String(error)
      }, 'error');
      throw error;
    }
  };

  const createModelInSpace = async (model: Model, targetApiKey: string): Promise<void> => {
    try {
      const adminSDK = createAdminApiClient(targetApiKey);

      // First check if model already exists
      const existingModelsResponse = await adminSDK.query({
        models: {
          id: true,
          name: true
        }
      });

      const existingModel = existingModelsResponse.data?.models?.find((m: any) => m.name === model.name);
      
      if (existingModel) {
        // Update existing model
        await adminSDK.mutation({
          updateModel: [
            {
              body: {
                id: existingModel.id,
                data: {
                  fields: model.fields || [],
                  helperText: model.helperText || "",
                  displayName: model.everything?.displayName || model.name
                }
              }
            },
            { id: true, name: true }
          ]
        });
        return;
      }

      // Create new model using Admin SDK
      await adminSDK.mutation({
        addModel: [
          {
            body: {
              name: model.name,
              kind: model.kind || "data",
              fields: model.fields || []
            }
          },
          { id: true, name: true }
        ]
      });

    } catch (error) {
      addDebugLog("❌ Exception in createModelInSpace", { 
        error: error instanceof Error ? error.message : String(error),
        modelName: model.name
      }, 'error');
      throw error;
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

  // Show migration target selection screen if enabled
  if (showMigrationTarget) {
    const availableTargetSpaces = spaces.filter((_, index) => index !== selectedSpaceIndex);
    
    return (
      <div className="admin-tools-container">
        <div className="admin-tools-max-width">
          {/* Header */}
          <div className="admin-tools-header">
            <h1 className="admin-tools-title">Select Target Space</h1>
            <p className="admin-tools-subtitle">Choose where to migrate {selectedModels.size} model{selectedModels.size !== 1 ? 's' : ''} from <strong>{spaces[selectedSpaceIndex].name}</strong></p>
          </div>
          
          {/* Target Space Selection Card */}
          <div className="admin-tools-card">
            <div className="admin-tools-section">
              {/* Target Space Selection */}
              <div className="admin-tools-section-spacing">
                <h2 className="admin-tools-section-title">Target Space</h2>
                <select
                  value={selectedTargetSpaceIndex}
                  onChange={(e) => setSelectedTargetSpaceIndex(parseInt(e.target.value))}
                  className="admin-tools-select"
                >
                  <option value={-1}>Select target space...</option>
                  {availableTargetSpaces.map((space, index) => {
                    const originalIndex = spaces.findIndex(s => s.privateKey === space.privateKey);
                    return (
                      <option key={originalIndex} value={originalIndex}>
                        {space.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Selected Models Summary */}
              <div className="admin-tools-section-spacing">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
                  Models to Migrate ({selectedModels.size})
                </h3>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  padding: '12px',
                  maxHeight: '150px',
                  overflowY: 'auto'
                }}>
                  {availableModels
                    .filter(model => selectedModels.has(model.id))
                    .map((model, index) => (
                      <div key={model.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingBottom: '6px',
                        marginBottom: index < selectedModels.size - 1 ? '6px' : '0',
                        borderBottom: index < selectedModels.size - 1 ? '1px solid #e9ecef' : 'none'
                      }}>
                        <span style={{ fontWeight: 500, color: '#111827' }}>{model.name}</span>
                        <span style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          backgroundColor: model.kind === 'page' ? '#dbeafe' : 
                                         model.kind === 'section' ? '#fef3c7' : 
                                         model.kind === 'data' ? '#f3e8ff' : '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontWeight: 500,
                          textTransform: 'capitalize'
                        }}>
                          {model.kind}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="admin-tools-border-top">
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
                  <button
                    onClick={backToModelSelection}
                    className="admin-tools-button-secondary"
                    disabled={running}
                  >
                    ← Back to Model Selection
                  </button>
                  <button
                    onClick={migrateSelectedModels}
                    disabled={running || selectedTargetSpaceIndex < 0}
                    className="admin-tools-button"
                  >
                    {running ? (
                      <>
                        <div className="admin-tools-spinner"></div>
                        Migrating...
                      </>
                    ) : (
                      `Migrate ${selectedModels.size} Model${selectedModels.size !== 1 ? 's' : ''}`
                    )}
                  </button>
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

          {/* Debug Panel */}
          <div className="admin-tools-card" style={{ marginTop: '1.5rem' }}>
            <div className="admin-tools-section" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Debug Information</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug
                  </button>
                  <button
                    onClick={clearDebugLog}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    Clear
                  </button>
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
        </div>
      </div>
    );
  }

  // Show model selection screen if enabled
  if (showModelSelection) {
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
                      onClick={selectAllModels}
                      className="admin-tools-button-secondary"
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllModels}
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
                      onClick={() => toggleModelSelection(model.id)}
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
                          onChange={() => toggleModelSelection(model.id)}
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
                    onClick={backToFeatureSelection}
                    className="admin-tools-button-secondary"
                    disabled={running}
                  >
                    ← Back
                  </button>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={exportSelectedModels}
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
                      onClick={showMigrationTargetSelection}
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

          {/* Debug Panel */}
          <div className="admin-tools-card" style={{ marginTop: '1.5rem' }}>
            <div className="admin-tools-section" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Debug Information</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowDebug(!showDebug)}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    {showDebug ? 'Hide' : 'Show'} Debug
                  </button>
                  <button
                    onClick={clearDebugLog}
                    className="admin-tools-button-secondary"
                    style={{ fontSize: '12px', padding: '4px 12px' }}
                  >
                    Clear
                  </button>
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
                  onFeatureChange={(feature) => {
                    setSelectedFeature(feature);
                    if (feature === 'modelSync' && selectedSpaceIndex >= 0) {
                      loadModelsForSelection(spaces[selectedSpaceIndex]);
                    }
                  }}
                  isVisible={selectedSpaceIndex >= 0}
                />
              </div>
            )}

            {/* Action Section */}
            {selectedSpaceIndex >= 0 && selectedFeature && selectedFeature !== 'modelSync' && (
              <div className="admin-tools-border-top">
                <div className="admin-tools-exec-header">
                  <div>
                    <h3 className="admin-tools-exec-title">Ready to Execute</h3>
                    <p className="admin-tools-exec-desc">
                      Running <strong>{selectedFeature === 'modelSync' ? 'Model Synchronization' : selectedFeature}</strong> on{' '}
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
                      Loading...
                    </>
                  ) : (
                    selectedFeature === 'modelSync' ? 'Select Models to Synchronize' : 'Run Feature'
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

        {/* Debug Panel */}
        <div className="admin-tools-card" style={{ marginTop: '1.5rem' }}>
          <div className="admin-tools-section" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Debug Information</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="admin-tools-button-secondary"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                >
                  {showDebug ? 'Hide' : 'Show'} Debug
                </button>
                <button
                  onClick={clearDebugLog}
                  className="admin-tools-button-secondary"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                >
                  Clear
                </button>
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
                        color: '#111827',
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
      </div>
    </div>
  );
};

export default AdminToolsPlugin;