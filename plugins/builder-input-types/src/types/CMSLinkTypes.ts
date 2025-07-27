export interface CMSLinkValue {
  id?: string;
  name?: string;
  model?: string;
  url?: string;
}

export interface CMSLinkProps {
  value?: CMSLinkValue;
  onChange?: (value: CMSLinkValue | null) => void;
  defaultType?: string;
  models?: string[];
}

export interface ContentItem {
  id?: string;
  name?: string;
  data?: any;
}