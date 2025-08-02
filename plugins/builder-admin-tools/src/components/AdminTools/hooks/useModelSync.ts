import { useState } from 'react';
import { useAdminApi, Model } from './useAdminApi';

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

export const useModelSync = () => {
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const { getAvailableModels, createModelInSpace } = useAdminApi();

  const loadModels = async (space: Space): Promise<Model[]> => {
    setRunning(true);
    setStatus("Loading models from space...");
    
    try {
      const models = await getAvailableModels(space.privateKey);
      
      if (models.length === 0) {
        setStatus("No models found in selected space");
        setAvailableModels([]);
        return [];
      }

      setAvailableModels(models);
      setSelectedModels(new Set());
      setStatus(`Found ${models.length} models. Select which models to export or migrate.`);
      
      return models;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error loading models: ${errorMessage}`);
      setAvailableModels([]);
      throw error;
    } finally {
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

  const exportSelectedModels = async (sourceSpace: Space): Promise<void> => {
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
        sourceSpace: sourceSpace.name,
        models: modelsToExport
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `builder-models-export-${sourceSpace.name}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus(`✅ Successfully exported ${selectedModels.size} models as JSON`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error exporting models: ${errorMessage}`);
      throw error;
    } finally {
      setRunning(false);
    }
  };

  const migrateSelectedModels = async (targetSpace: Space, onProgress?: (message: string) => void): Promise<void> => {
    if (selectedModels.size === 0) {
      setStatus("No models selected for migration");
      return;
    }

    setRunning(true);
    setStatus("Starting migration...");

    try {
      const modelsToMigrate = availableModels.filter(model => selectedModels.has(model.id));

      // Check if target models already exist
      setStatus("Checking existing models in target space...");
      onProgress?.("Checking existing models in target space...");
      
      const targetModels = await getAvailableModels(targetSpace.privateKey);
      const existingModelNames = new Set(targetModels.map(m => m.name));

      let migratedCount = 0;
      let errorCount = 0;

      for (const model of modelsToMigrate) {
        const existsInTarget = existingModelNames.has(model.name);
        
        try {
          const progressMessage = `${existsInTarget ? 'Updating' : 'Creating'} "${model.name}" in ${targetSpace.name}... (${migratedCount + errorCount + 1}/${modelsToMigrate.length})`;
          setStatus(progressMessage);
          onProgress?.(progressMessage);
          
          await createModelInSpace(model, targetSpace.privateKey);
          migratedCount++;
        } catch (error) {
          console.error(`Error ${existsInTarget ? 'updating' : 'creating'} model ${model.name}:`, error);
          errorCount++;
        }
      }

      // Final status
      if (errorCount === 0) {
        setStatus(`Successfully processed ${migratedCount} models to ${targetSpace.name}`);
      } else {
        setStatus(`⚠️ Migration completed: ${migratedCount} processed, ${errorCount} errors`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error during migration: ${errorMessage}`);
      throw error;
    } finally {
      setRunning(false);
    }
  };

  const resetState = () => {
    setAvailableModels([]);
    setSelectedModels(new Set());
    setStatus('');
  };

  return {
    availableModels,
    selectedModels,
    running,
    status,
    loadModels,
    toggleModelSelection,
    selectAllModels,
    deselectAllModels,
    exportSelectedModels,
    migrateSelectedModels,
    resetState
  };
};