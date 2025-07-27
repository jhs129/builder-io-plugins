export interface ApiTagsType {
  name: string;
  endPoint: string;
}

export interface ApiTagsSettings {
  types: ApiTagsType[];
}

export interface ApiTagOption {
  value: string;
  label?: string;
}

export interface ApiTagsPluginContext {
  iframeRef?: { current: HTMLIFrameElement | null };
}
