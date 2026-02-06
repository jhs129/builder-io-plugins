// Basic type definitions to replace @orlandohealth/types

export interface ClinicalTrial {
  data: {
    title: string | { Default: string };
    slug?: string;
    identification?: {
      orgStudyId?: string;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface CtDotGovStudy {
  [key: string]: unknown;
}
