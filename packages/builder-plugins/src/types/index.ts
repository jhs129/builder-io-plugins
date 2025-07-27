// Basic type definitions to replace @orlandohealth/types

export interface ClinicalTrial {
  data: {
    title: string | { Default: string };
    slug?: string;
    identification?: {
      orgStudyId?: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

export interface CtDotGovStudy {
  [key: string]: any;
}