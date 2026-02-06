// Basic utility functions to replace @orlandohealth/utils

export const logger = {
  log: (message: string, ...args: unknown[]) => console.log(message, ...args),
  error: (message: string, ...args: unknown[]) =>
    console.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => console.warn(message, ...args),
  info: (message: string, ...args: unknown[]) => console.info(message, ...args),
};

export async function insertModelContent(
  content: Record<string, unknown>,
  model: string,
  apiKey: string
) {
  // Placeholder implementation - you'll need to implement actual Builder.io API calls
  const response = await fetch(`https://builder.io/api/v1/write/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(content),
  });

  if (!response.ok) {
    throw new Error(`Failed to insert content: ${response.statusText}`);
  }

  return response.json();
}

export async function updateModelContent(
  content: Record<string, unknown>,
  model: string,
  id: string,
  apiKey: string
) {
  // Placeholder implementation - you'll need to implement actual Builder.io API calls
  const response = await fetch(
    `https://builder.io/api/v1/write/${model}/${id}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to update content: ${response.statusText}`);
  }

  return response.json();
}

export async function enrichTrialWithClinicalTrialsGovData(
  trial: Record<string, unknown>
) {
  // Placeholder implementation for enriching trial data
  // You can implement actual logic to fetch from ClinicalTrials.gov API
  return trial;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
