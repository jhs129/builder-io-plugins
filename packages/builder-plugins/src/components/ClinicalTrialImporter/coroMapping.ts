import { ClinicalTrial, CtDotGovStudy } from "../../types";
import {
  enrichTrialWithClinicalTrialsGovData,
  generateSlug as createSlug,
  logger,
} from "../../utils";

// Add validation function for NCT IDs
function isValidNctId(nctId: string): boolean {
  // NCT ID format: NCT followed by exactly 8 digits
  const nctIdRegex = /^NCT\d{8}$/;
  return nctIdRegex.test(nctId);
}

async function fetchClinicalTrialsGovData(
  nctId: string
): Promise<CtDotGovStudy> {
  const response = await fetch(
    `https://clinicaltrials.gov/api/v2/studies/${nctId}`
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch clinical trials data: ${response.statusText}`
    );
  }
  return response.json();
}

function splitAndCreateArray(
  value: string | undefined,
  delimiter: string,
  asObject?: { [key: string]: boolean }
): any[] {
  if (!value) return [];
  const items = value
    .split(new RegExp(`[${delimiter}\t]`))
    .map((item) => item.trim())
    .filter((item) => item);

  if (asObject) {
    return items.map((item) => {
      const obj: any = {};
      Object.keys(asObject).forEach((key) => {
        obj[key] = item;
      });
      return obj;
    });
  }

  return items;
}

export async function createBaseTrial(row: any): Promise<ClinicalTrial> {
  let trial: ClinicalTrial = {
    name: "CORO-" + row["Protocol Abbrev"],
    published: "published",
    data: {
      locale: "en",
      title: row["Title (full)"],
      subtitle: row["Title (full)"],
      slug: createSlug(row["Protocol Abbrev"]),
      identification: {
        nctId: row["ClinicalTrials.gov ID"],
        irbNumber: row["IRB No."],
        orgStudyId: row["Protocol Abbrev"],
        orgStudyId2: row["Secondary Protocol No."],
      },
      description: {
        objective: row["Objective"],
        phase: row["Phase"],
        conditions: splitAndCreateArray(row["Condition"], ";"),
        interventions: [
          ...splitAndCreateArray(row["Therapies Involved"], ";"),
          ...splitAndCreateArray(row["Treatment"], ";"),
        ],
      },
      contactsLocations: {
        principalInvestigator: row["Principal Investigator"],
        subInvestigators: splitAndCreateArray(row["Sub Investigators"], ";", {
          name: true,
        }),
        contacts: splitAndCreateArray(row["Contact"], ";", { name: true }),
        phoneNumbers: splitAndCreateArray(row["Phone"], ";", { number: true }),
      },
      eligibility: {
        ageGroup: row["Age Group"],
        criteria: row["Key Eligibility"] || "",
      },
      source: {
        data: row,
        system: "CORO",
      },
    },
  };

  if (
    trial?.data?.identification?.nctId &&
    isValidNctId(trial.data.identification.nctId)
  ) {
    try {
      const study = await fetchClinicalTrialsGovData(
        trial.data.identification.nctId
      );
      trial = enrichTrialWithClinicalTrialsGovData(trial, study);
    } catch (error) {
      logger.error(
        "Error Fetching ClinicalTrials.gov data",
        "plugin.clinicaltrials",
        error
      );
      console.error(
        `Error fetching ClinicalTrials.gov data for NCT ID ${trial?.data?.identification?.nctId}`,
        error
      );
    }
  } else if (trial?.data?.identification?.nctId) {
    logger.warn("Invalid NCT ID format", "plugin.clinicaltrials", {
      nctId: trial.data.identification.nctId,
    });
  }

  return trial;
}
