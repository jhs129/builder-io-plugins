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
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Builder.io Admin Tools</h2>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }
  
  if (spaces.length === 0) {
    return <ConfigurationStatus status={status} />;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Builder.io Admin Tools</h1>
      
      <div className="space-y-6">
        <SpaceSelector
          spaces={spaces}
          selectedSpaceIndex={selectedSpaceIndex}
          onSpaceChange={setSelectedSpaceIndex}
        />

        <FeatureSelector
          selectedFeature={selectedFeature}
          onFeatureChange={setSelectedFeature}
          isVisible={selectedSpaceIndex >= 0}
        />

        {selectedSpaceIndex >= 0 && selectedFeature && (
          <div>
            <button
              onClick={handleRunFeature}
              disabled={running}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {running ? "Running..." : "Run Feature"}
            </button>
          </div>
        )}

        {status && (
          <div className={`p-4 rounded-md ${
            status.startsWith("Error") 
              ? "bg-red-100 border border-red-400 text-red-700"
              : status.includes("completed")
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-blue-100 border border-blue-400 text-blue-700"
          }`}>
            <p>{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminToolsPlugin;