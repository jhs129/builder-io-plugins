import React, { useEffect } from "react";
import appState from "@builder.io/app-context";
import { pluginId } from "../../utils";
import { ConfigurationStatus, StatusDisplay } from "builder-plugins";
import { SpaceSelector } from "./SpaceSelector";
import { FeatureSelector } from "./FeatureSelector";
import { ModelSelection } from "./ModelSelection";
import { ComponentAuditView } from "./ComponentAuditView";
import { ComponentDetailView } from "./ComponentDetailView";
import { AdminToolsProvider, useAdminToolsContext, Space } from "./AdminToolsContext";
import { useModelSync } from "./hooks/useModelSync";
import { useComponentAudit } from "./hooks/useComponentAudit";

const AdminToolsContent = () => {
  const {
    state,
    setSpaces,
    setLoading,
    setConfigStatus,
    setCurrentView,
    setSelectedFeature,
    setSelectedSpaceIndex,
    setSelectedComponentName,
    setStatus,
    setRunning,
    addDebugLog,
    clearDebugLog,
    setShowDebug,
    resetFeatureState,
  } = useAdminToolsContext();

  const modelSync = useModelSync();
  const componentAudit = useComponentAudit();

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const pluginSettings = appState?.user?.organization?.value?.settings?.plugins?.get?.(pluginId);
      console.log("appState.user", appState.user);
      console.log("appState.user.organization.value.roles", appState?.user?.organization?.value?.roles);
      console.log("appState.user.mainSpaceApiKey", appState.user.mainSpaceApiKey);
      
      if (!pluginSettings) {
        setConfigStatus("Plugin settings not found. Please configure the plugin first.");
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
        setConfigStatus("Please configure your spaces in the plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      if (!spacesConfig) {
        setConfigStatus("Please configure your spaces in the plugin settings.");
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
        setConfigStatus("Error accessing space configuration. Please check your plugin settings.");
        setSpaces([]);
        setLoading(false);
        return;
      }

      if (!Array.isArray(spaceArray) || spaceArray.length === 0) {
        setConfigStatus("Please add at least one space in the plugin settings.");
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
      setConfigStatus("");
      setLoading(false);
    } catch (error) {
      console.error("Error loading plugin settings:", error);
      setConfigStatus("Error loading plugin settings. Please check configuration.");
      setSpaces([]);
      setLoading(false);
    }
  };

  const runComponentAudit = async () => {
    const publicKey = appState.user.mainSpaceApiKey;
    
    if (!publicKey) {
      setStatus("No main space API key found. Please ensure you're in a Builder.io space.");
      return;
    }
    
    const mainSpace = {
      name: "Current Space",
      publicKey: publicKey,
      privateKey: "" // Not needed for component audit
    };
    
    setRunning(true);
    try {
      const report = await componentAudit.runComponentAuditForModels(mainSpace, ['page', 'article']);
      if (report.length >= 0) {
        setCurrentView('componentAudit');
      }
    } catch (error) {
      console.error("Error running component audit:", error);
      addDebugLog("❌ Component audit failed", { error: error instanceof Error ? error.message : String(error) }, 'error');
    } finally {
      setRunning(false);
    }
  };

  const handleFeatureChange = async (feature: string) => {
    setSelectedFeature(feature as any);
    resetFeatureState();
    modelSync.resetState();
    componentAudit.clearReport();
    
    // Auto-execute Component Audit when selected
    if (feature === 'componentAudit') {
      await runComponentAudit();
    }
  };

  const handleRunFeature = async () => {
    if (!state.selectedFeature) return;
    
    // For Component Audit, use the dedicated function
    if (state.selectedFeature === "componentAudit") {
      await runComponentAudit();
      return;
    }
    
    // For other features, require space selection
    if (state.selectedSpaceIndex < 0) return;
    const space = state.spaces[state.selectedSpaceIndex];

    switch (state.selectedFeature) {
      case "contentPurger":
        setRunning(true);
        setStatus("Initializing...");
        try {
          await runContentPurger(space);
          setStatus(`Content purger completed successfully for space: ${space.name}`);
        } catch (error) {
          console.error("Error running content purger:", error);
          setStatus(`Error running content purger: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          setRunning(false);
        }
        break;
      default:
        setStatus("Unknown feature selected");
    }
  };

  const handleLoadModelsForSync = async () => {
    if (state.selectedSpaceIndex < 0) return;
    
    const space = state.spaces[state.selectedSpaceIndex];
    try {
      await modelSync.loadModels(space);
      setCurrentView('modelSelection');
    } catch (error) {
      console.error("Error loading models:", error);
      addDebugLog("❌ Failed to load models", { error: error instanceof Error ? error.message : String(error) }, 'error');
    }
  };

  const runContentPurger = async (space: Space) => {
    setStatus("Analyzing content in space...");
    
    // This is a placeholder implementation
    setStatus(`Would purge content in ${space.name}. (Implementation pending)`);
  };

  if (state.loading) {
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
  
  if (state.spaces.length === 0) {
    return (
      <div className="admin-tools-container">
        <div className="admin-tools-max-width">
          <ConfigurationStatus status={state.configStatus} />
        </div>
      </div>
    );
  }

  // Render specific views
  if (state.currentView === 'componentAudit') {
    const currentSpace = state.selectedSpaceIndex >= 0 ? 
      state.spaces[state.selectedSpaceIndex] : 
      { name: "Current Space", publicKey: appState.user.currentOrganization, privateKey: "" };
      
    return (
      <ComponentAuditView
        space={currentSpace}
        report={componentAudit.report}
        status={componentAudit.status}
        onBack={() => setCurrentView('main')}
        onViewComponent={(componentName) => {
          setSelectedComponentName(componentName);
          setCurrentView('componentDetail');
        }}
      />
    );
  }

  if (state.currentView === 'componentDetail') {
    const currentSpace = state.selectedSpaceIndex >= 0 ? 
      state.spaces[state.selectedSpaceIndex] : 
      { name: "Current Space", publicKey: appState.user.currentOrganization, privateKey: "" };
    
    const selectedComponent = componentAudit.report.find(
      component => component.componentName === state.selectedComponentName
    );
    
    if (!selectedComponent) {
      // If component not found, go back to audit view
      setCurrentView('componentAudit');
      return null;
    }
      
    return (
      <ComponentDetailView
        space={currentSpace}
        component={selectedComponent}
        onBack={() => setCurrentView('componentAudit')}
        onBackToMain={() => setCurrentView('main')}
      />
    );
  }

  if (state.currentView === 'modelSelection') {
    return (
      <ModelSelection
        spaces={state.spaces}
        selectedSpaceIndex={state.selectedSpaceIndex}
        availableModels={modelSync.availableModels}
        selectedModels={modelSync.selectedModels}
        running={modelSync.running}
        status={modelSync.status}
        onBack={() => setCurrentView('main')}
        onToggleModel={modelSync.toggleModelSelection}
        onSelectAll={modelSync.selectAllModels}
        onDeselectAll={modelSync.deselectAllModels}
        onExport={() => modelSync.exportSelectedModels(state.spaces[state.selectedSpaceIndex])}
        onMigrate={() => {
          // TODO: Implement migration target selection
          setStatus("Migration target selection not yet implemented");
        }}
      />
    );
  }

  // Main view
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
            {/* Feature Selection Section - Show First */}
            <div className="admin-tools-section-spacing">
              <h2 className="admin-tools-section-title">Choose Feature</h2>
              <FeatureSelector
                selectedFeature={state.selectedFeature}
                onFeatureChange={handleFeatureChange}
                isVisible={true}
              />
            </div>

            {/* Space Selection Section - Show After Feature (except for Component Audit) */}
            {state.selectedFeature && state.selectedFeature !== 'componentAudit' && (
              <div className="admin-tools-section-spacing">
                <h2 className="admin-tools-section-title">Select Space</h2>
                <SpaceSelector
                  spaces={state.spaces}
                  selectedSpaceIndex={state.selectedSpaceIndex}
                  onSpaceChange={setSelectedSpaceIndex}
                />
              </div>
            )}

            {/* Action Section - Show for all features except modelSync and componentAudit */}
            {(state.selectedSpaceIndex >= 0 && state.selectedFeature && 
              state.selectedFeature !== 'modelSync' && state.selectedFeature !== 'componentAudit') && (
              <div className="admin-tools-border-top">
                <div className="admin-tools-exec-header">
                  <div>
                    <h3 className="admin-tools-exec-title">Ready to Execute</h3>
                    <p className="admin-tools-exec-desc">
                      Running <strong>{
                        state.selectedFeature === 'componentAudit' ? 'Component Audit' :
                        state.selectedFeature === 'contentPurger' ? 'Content Purger' :
                        state.selectedFeature
                      }</strong> on{' '}
                      <strong>{
                        state.selectedFeature === 'componentAudit' ? 'Current Space' :
                        state.spaces[state.selectedSpaceIndex].name
                      }</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunFeature}
                  disabled={state.running || componentAudit.running}
                  className="admin-tools-button"
                >
                  {(state.running || componentAudit.running) ? (
                    <>
                      <div className="admin-tools-spinner"></div>
                      Loading...
                    </>
                  ) : (
                    state.selectedFeature === 'componentAudit' ? 'Analyze Component Usage' :
                    state.selectedFeature === 'contentPurger' ? 'Run Content Purger' :
                    'Run Feature'
                  )}
                </button>
              </div>
            )}

            {/* Model Sync Auto-trigger */}
            {state.selectedFeature === 'modelSync' && state.selectedSpaceIndex >= 0 && state.currentView === 'main' && (
              <div className="admin-tools-border-top">
                <div className="admin-tools-exec-header">
                  <div>
                    <h3 className="admin-tools-exec-title">Ready to Load Models</h3>
                    <p className="admin-tools-exec-desc">
                      Loading models from <strong>{state.spaces[state.selectedSpaceIndex].name}</strong> for synchronization
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLoadModelsForSync}
                  disabled={state.running || modelSync.running}
                  className="admin-tools-button"
                >
                  {(state.running || modelSync.running) ? (
                    <>
                      <div className="admin-tools-spinner"></div>
                      Loading Models...
                    </>
                  ) : (
                    'Load Models for Selection'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Section */}
        <StatusDisplay
          status={state.status || componentAudit.status || modelSync.status}
          debugInfo={state.debugInfo}
          showDebug={state.showDebug}
          onToggleDebug={() => setShowDebug(!state.showDebug)}
          onClearDebug={clearDebugLog}
        />
      </div>
    </div>
  );
};

const AdminToolsPlugin = () => {
  return (
    <AdminToolsProvider>
      <AdminToolsContent />
    </AdminToolsProvider>
  );
};

export default AdminToolsPlugin;