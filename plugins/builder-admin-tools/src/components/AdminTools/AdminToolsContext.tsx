import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Space {
  name: string;
  publicKey: string;
  privateKey: string;
}

export type FeatureType = 'modelSync' | 'componentAudit' | 'contentPurger' | '';
export type ViewType = 'main' | 'modelSelection' | 'componentAudit' | 'componentDetail' | 'migration';

interface AdminToolsState {
  // Configuration
  spaces: Space[];
  loading: boolean;
  configStatus: string;
  
  // Navigation
  currentView: ViewType;
  selectedFeature: FeatureType;
  selectedSpaceIndex: number;
  selectedComponentName: string;
  
  // Model Migration State
  selectedTargetSpaceIndex: number;
  migrationCompleted: boolean;
  
  // UI State
  status: string;
  running: boolean;
  
  // Debug
  debugInfo: any[];
  showDebug: boolean;
}

type AdminToolsAction =
  | { type: 'SET_SPACES'; payload: Space[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CONFIG_STATUS'; payload: string }
  | { type: 'SET_CURRENT_VIEW'; payload: ViewType }
  | { type: 'SET_SELECTED_FEATURE'; payload: FeatureType }
  | { type: 'SET_SELECTED_SPACE_INDEX'; payload: number }
  | { type: 'SET_SELECTED_COMPONENT_NAME'; payload: string }
  | { type: 'SET_SELECTED_TARGET_SPACE_INDEX'; payload: number }
  | { type: 'SET_MIGRATION_COMPLETED'; payload: boolean }
  | { type: 'SET_STATUS'; payload: string }
  | { type: 'SET_RUNNING'; payload: boolean }
  | { type: 'ADD_DEBUG_LOG'; payload: any }
  | { type: 'CLEAR_DEBUG_LOG' }
  | { type: 'SET_SHOW_DEBUG'; payload: boolean }
  | { type: 'RESET_FEATURE_STATE' }
  | { type: 'RESET_ALL_STATE' };

const initialState: AdminToolsState = {
  spaces: [],
  loading: true,
  configStatus: '',
  currentView: 'main',
  selectedFeature: '',
  selectedSpaceIndex: -1,
  selectedComponentName: '',
  selectedTargetSpaceIndex: -1,
  migrationCompleted: false,
  status: '',
  running: false,
  debugInfo: [],
  showDebug: false,
};

function adminToolsReducer(state: AdminToolsState, action: AdminToolsAction): AdminToolsState {
  switch (action.type) {
    case 'SET_SPACES':
      return { ...state, spaces: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CONFIG_STATUS':
      return { ...state, configStatus: action.payload };
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_SELECTED_FEATURE':
      return { ...state, selectedFeature: action.payload };
    case 'SET_SELECTED_SPACE_INDEX':
      return { ...state, selectedSpaceIndex: action.payload };
    case 'SET_SELECTED_COMPONENT_NAME':
      return { ...state, selectedComponentName: action.payload };
    case 'SET_SELECTED_TARGET_SPACE_INDEX':
      return { ...state, selectedTargetSpaceIndex: action.payload };
    case 'SET_MIGRATION_COMPLETED':
      return { ...state, migrationCompleted: action.payload };
    case 'SET_STATUS':
      return { ...state, status: action.payload };
    case 'SET_RUNNING':
      return { ...state, running: action.payload };
    case 'ADD_DEBUG_LOG':
      return { ...state, debugInfo: [...state.debugInfo, action.payload] };
    case 'CLEAR_DEBUG_LOG':
      return { ...state, debugInfo: [] };
    case 'SET_SHOW_DEBUG':
      return { ...state, showDebug: action.payload };
    case 'RESET_FEATURE_STATE':
      return {
        ...state,
        currentView: 'main',
        selectedSpaceIndex: -1,
        selectedTargetSpaceIndex: -1,
        migrationCompleted: false,
        status: '',
      };
    case 'RESET_ALL_STATE':
      return {
        ...initialState,
        spaces: state.spaces, // Keep spaces config
        loading: false,
      };
    default:
      return state;
  }
}

interface AdminToolsContextType {
  state: AdminToolsState;
  dispatch: React.Dispatch<AdminToolsAction>;
  
  // Helper functions
  setSpaces: (spaces: Space[]) => void;
  setLoading: (loading: boolean) => void;
  setConfigStatus: (status: string) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedFeature: (feature: FeatureType) => void;
  setSelectedSpaceIndex: (index: number) => void;
  setSelectedComponentName: (componentName: string) => void;
  setSelectedTargetSpaceIndex: (index: number) => void;
  setMigrationCompleted: (completed: boolean) => void;
  setStatus: (status: string) => void;
  setRunning: (running: boolean) => void;
  addDebugLog: (message: string, data?: any, level?: 'info' | 'warning' | 'error') => void;
  clearDebugLog: () => void;
  setShowDebug: (show: boolean) => void;
  resetFeatureState: () => void;
  resetAllState: () => void;
}

const AdminToolsContext = createContext<AdminToolsContextType | undefined>(undefined);

export const useAdminToolsContext = () => {
  const context = useContext(AdminToolsContext);
  if (context === undefined) {
    throw new Error('useAdminToolsContext must be used within an AdminToolsProvider');
  }
  return context;
};

interface AdminToolsProviderProps {
  children: ReactNode;
}

export const AdminToolsProvider: React.FC<AdminToolsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(adminToolsReducer, initialState);

  const setSpaces = (spaces: Space[]) => dispatch({ type: 'SET_SPACES', payload: spaces });
  const setLoading = (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading });
  const setConfigStatus = (status: string) => dispatch({ type: 'SET_CONFIG_STATUS', payload: status });
  const setCurrentView = (view: ViewType) => dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  const setSelectedFeature = (feature: FeatureType) => dispatch({ type: 'SET_SELECTED_FEATURE', payload: feature });
  const setSelectedSpaceIndex = (index: number) => dispatch({ type: 'SET_SELECTED_SPACE_INDEX', payload: index });
  const setSelectedComponentName = (componentName: string) => dispatch({ type: 'SET_SELECTED_COMPONENT_NAME', payload: componentName });
  const setSelectedTargetSpaceIndex = (index: number) => dispatch({ type: 'SET_SELECTED_TARGET_SPACE_INDEX', payload: index });
  const setMigrationCompleted = (completed: boolean) => dispatch({ type: 'SET_MIGRATION_COMPLETED', payload: completed });
  const setStatus = (status: string) => dispatch({ type: 'SET_STATUS', payload: status });
  const setRunning = (running: boolean) => dispatch({ type: 'SET_RUNNING', payload: running });
  const clearDebugLog = () => dispatch({ type: 'CLEAR_DEBUG_LOG' });
  const setShowDebug = (show: boolean) => dispatch({ type: 'SET_SHOW_DEBUG', payload: show });
  const resetFeatureState = () => dispatch({ type: 'RESET_FEATURE_STATE' });
  const resetAllState = () => dispatch({ type: 'RESET_ALL_STATE' });

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
    
    dispatch({ type: 'ADD_DEBUG_LOG', payload: logEntry });
    
    if (level === 'error') {
      console.error(`[AdminTools] ${timestamp}: ${message}`, data);
    } else if (level === 'warning') {
      console.warn(`[AdminTools] ${timestamp}: ${message}`, data);
    }
  };

  const value: AdminToolsContextType = {
    state,
    dispatch,
    setSpaces,
    setLoading,
    setConfigStatus,
    setCurrentView,
    setSelectedFeature,
    setSelectedSpaceIndex,
    setSelectedComponentName,
    setSelectedTargetSpaceIndex,
    setMigrationCompleted,
    setStatus,
    setRunning,
    addDebugLog,
    clearDebugLog,
    setShowDebug,
    resetFeatureState,
    resetAllState,
  };

  return <AdminToolsContext.Provider value={value}>{children}</AdminToolsContext.Provider>;
};