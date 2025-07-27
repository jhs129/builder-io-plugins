export interface ApiTagOption {
  value: string;
  label?: string;
}

export interface ApiTagsValue {
  tags: any[]; // Array of values only
}

export interface ApiTagHeader {
  name: string;
  value: string;
}

export interface ApiTagsProps {
  customEditor: {
    name: string;
    endPoint: string;
    headers?: ApiTagHeader[];
    dataPath: string;
    labelField: string;
    valueField: string;
  };
  value: any[] & {
    get?: () => any[];
  };
  onChange: (value: any[]) => void;
}

export interface ApiResponse {
  results?: Array<{
    [key: string]: any;
  }>;
  [key: string]: any;
}
