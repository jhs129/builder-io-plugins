import { useState } from 'react';
import { createAdminApiClient } from "@builder.io/admin-sdk";

export interface Model {
  id: string;
  name: string;
  kind: string;
  fields?: any[];
  helperText?: string;
  everything?: any;
}

export interface PageContent {
  id: string;
  name?: string;
  published?: string;
  componentsUsed?: string[];
  lastPreviewUrl?: string;
}

export const useAdminApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAvailableModels = async (privateApiKey: string): Promise<Model[]> => {
    try {
      setLoading(true);
      setError(null);
      
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch models: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createModelInSpace = async (model: Model, targetApiKey: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to create/update model ${model.name}: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPageContent = async (publicKey: string, modelName: string): Promise<PageContent[]> => {
    try {
      setLoading(true);
      setError(null);
      
      // Use Builder.io v3 GraphQL API
      const query = `query {
        ${modelName} {
          id
          name
          published
          everything
        }
      }`;

      const encodedQuery = encodeURIComponent(query);
      const url = `https://cdn.builder.io/api/v3/graphql/${publicKey}?query=${encodedQuery}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok || result.errors) {
        throw new Error(`GraphQL query failed: ${result.errors?.[0]?.message || response.statusText || 'Unknown error'}`);
      }

      const content = result.data?.[modelName] || [];
      
      return content.map((item: any) => ({
        id: item.id,
        name: item.name || 'Untitled',
        published: item.published,
        componentsUsed: extractComponentsUsed(item.everything),
        lastPreviewUrl: item.everything?.meta?.lastPreviewUrl
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch page content for ${modelName}: ${errorMessage}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getAvailableModels,
    createModelInSpace,
    getPageContent
  };
};

const extractComponentsUsed = (everything: any): string[] => {
  const components = new Set<string>();
  
  // First, check if componentsUsed is directly available in meta
  if (everything?.meta?.componentsUsed && typeof everything.meta.componentsUsed === 'object') {
    // componentsUsed appears to be an object with component names as keys and counts as values
    Object.keys(everything.meta.componentsUsed).forEach(componentName => {
      components.add(componentName);
    });
  }
  
  // Also traverse the data structure to find components
  const traverse = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    
    // Check if this object has a component property
    if (obj.component && typeof obj.component === 'string') {
      components.add(obj.component);
    }
    
    // Check if this object has a @type property (alternative component identifier)
    if (obj['@type'] && typeof obj['@type'] === 'string') {
      components.add(obj['@type']);
    }
    
    // Recursively traverse arrays and objects
    if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else {
      Object.values(obj).forEach(traverse);
    }
  };
  
  // Traverse the entire everything object to catch any components
  traverse(everything);
  
  return Array.from(components);
};