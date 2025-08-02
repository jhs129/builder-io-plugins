import { useState } from 'react';
import { useAdminApi, PageContent } from './useAdminApi';

export interface ComponentUsageReport {
  componentName: string;
  usageCount: number;
  pages: Array<{
    id: string;
    name: string;
    editUrl: string;
  }>;
}

interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

export const useComponentAudit = () => {
  const [report, setReport] = useState<ComponentUsageReport[]>([]);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const { getAvailableModels, getPageContent } = useAdminApi();

  const runComponentAudit = async (space: Space): Promise<ComponentUsageReport[]> => {
    setRunning(true);
    setStatus("Analyzing component usage...");

    try {
      // Get page models from the space
      const models = await getAvailableModels(space.privateKey);
      const pageModels = models.filter(model => model.kind === 'page');

      if (pageModels.length === 0) {
        setStatus("No page models found in selected space");
        setRunning(false);
        return [];
      }

      setStatus(`Found ${pageModels.length} page model(s). Fetching content...`);

      // Fetch content for each page model
      const allPages: PageContent[] = [];
      for (const model of pageModels) {
        setStatus(`Fetching content for model: ${model.name}...`);
        const pages = await getPageContent(space.publicKey, model.name);
        allPages.push(...pages);
      }

      setStatus(`Analyzing ${allPages.length} pages for component usage...`);

      // Analyze component usage
      const auditReport = analyzeComponentUsage(allPages);

      setReport(auditReport);
      setStatus(`✅ Component audit completed. Found ${auditReport.length} unique components across ${allPages.length} pages.`);
      
      return auditReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error running component audit: ${errorMessage}`);
      throw error;
    } finally {
      setRunning(false);
    }
  };

  const runComponentAuditForModels = async (space: Space, modelNames: string[]): Promise<ComponentUsageReport[]> => {
    setRunning(true);
    setStatus("Analyzing component usage...");

    try {
      setStatus(`Fetching content from ${modelNames.join(', ')} models...`);

      // Fetch content for specified models
      const allPages: PageContent[] = [];
      for (const modelName of modelNames) {
        setStatus(`Fetching content for ${modelName} model...`);
        try {
          const pages = await getPageContent(space.publicKey, modelName);
          allPages.push(...pages);
          setStatus(`Found ${pages.length} ${modelName} entries`);
        } catch (error) {
          console.warn(`Failed to fetch ${modelName} content:`, error);
          setStatus(`Warning: Could not fetch ${modelName} content. Continuing with other models...`);
        }
      }

      if (allPages.length === 0) {
        setStatus("No content found in any of the specified models");
        setRunning(false);
        return [];
      }

      setStatus(`Analyzing ${allPages.length} pages for component usage...`);

      // Analyze component usage
      const auditReport = analyzeComponentUsage(allPages);

      setReport(auditReport);
      setStatus(`✅ Component audit completed. Found ${auditReport.length} unique components across ${allPages.length} pages.`);
      
      return auditReport;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error running component audit: ${errorMessage}`);
      throw error;
    } finally {
      setRunning(false);
    }
  };

  const analyzeComponentUsage = (pages: PageContent[]): ComponentUsageReport[] => {
    const componentMap = new Map<string, ComponentUsageReport>();
    
    pages.forEach(page => {
      const components = page.componentsUsed || [];
      
      components.forEach(componentName => {
        if (!componentMap.has(componentName)) {
          componentMap.set(componentName, {
            componentName,
            usageCount: 0,
            pages: []
          });
        }
        
        const reportItem = componentMap.get(componentName)!;
        reportItem.usageCount++;
        reportItem.pages.push({
          id: page.id,
          name: page.name || 'Untitled',
          editUrl: `https://builder.io/content/${page.id}`
        });
      });
    });
    
    // Sort by usage count (descending)
    return Array.from(componentMap.values()).sort((a, b) => b.usageCount - a.usageCount);
  };

  const clearReport = () => {
    setReport([]);
    setStatus('');
  };

  return {
    report,
    running,
    status,
    runComponentAudit,
    runComponentAuditForModels,
    clearReport
  };
};