// Replace with local type definition
export type RegionalCareSiteId = string;

export interface HitProps {
  hit: {
    objectID: string;
    id?: string;
    title?: string;
    name?: string;
    url?: string;
    locale?: string;
    metadata?: {
      description?: string;
    };
    media?: string;
  };
  onSelect: (hit: HitProps['hit']) => void;
  isSelected: boolean;
}

export interface ModelSelection {
  id: string;
  name: string;
  href: string;
  type: string;
}

export interface SearchModelSelectorProps {
  href?: string;
  referenceId?: string;
  onModelSelect: (model: ModelSelection) => void;
  apiKey: string;
  appId: string;
  regionalCareSite?: RegionalCareSiteId;
  locale: string;
  indexes: {
    name: string;
    model: string;
  }[];
}

export interface FacetPanelProps {
  header: string;
  children: React.ReactNode;
}

export interface LocaleRefinementListProps {
  locale: string;
}

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  indexes: SearchModelSelectorProps['indexes'];
  searchClient: unknown;
  locale: string;
  regionalCareSite?: RegionalCareSiteId;
  onModelSelect: (model: ModelSelection) => void;
}
