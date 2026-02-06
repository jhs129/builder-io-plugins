/**
 * Test harness for Builder.io GraphQL queries used in the Component Audit feature.
 *
 * Tests:
 * 1. Admin API - fetch all models and filter by kind "page"
 * 2. Content API v3 GraphQL - fetch page content for each page-kind model
 * 3. GraphQL introspection - discover available query fields
 *
 * Usage:
 *   node scripts/test-graphql-queries.mjs
 *
 * Requires BUILDER_PUBLIC_KEY and BUILDER_PRIVATE_KEY in .env
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env");
    const envContent = readFileSync(envPath, "utf-8");
    const vars = {};
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      vars[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
    return vars;
  } catch {
    console.error("Failed to load .env file. Copy env.example to .env and fill in your keys.");
    process.exit(1);
  }
}

const env = loadEnv();
const PUBLIC_KEY = env.BUILDER_PUBLIC_KEY;
const PRIVATE_KEY = env.BUILDER_PRIVATE_KEY;

if (!PUBLIC_KEY || !PRIVATE_KEY) {
  console.error("Missing BUILDER_PUBLIC_KEY or BUILDER_PRIVATE_KEY in .env");
  process.exit(1);
}

/**
 * Convert kebab-case model name to camelCase for Builder.io v3 content GraphQL API.
 * e.g. "landing-page" -> "landingPage", "marketing-landing-pages" -> "marketingLandingPages"
 */
function toGraphQLFieldName(modelName) {
  return modelName.replace(/-([a-zA-Z0-9])/g, (_, c) => c.toUpperCase());
}

// ── Test 1: Admin API - Fetch models ─────────────────────────────────

async function testAdminApiGetModels() {
  console.log("\n═══ Test 1: Admin API - Fetch Models ═══");
  console.log(`Using private key: ${PRIVATE_KEY.slice(0, 8)}...`);

  try {
    const { createAdminApiClient } = await import("@builder.io/admin-sdk");
    const adminSDK = createAdminApiClient(PRIVATE_KEY);

    const response = await adminSDK.query({
      models: {
        id: true,
        name: true,
        kind: true,
        everything: true,
      },
    });

    const models = response.data?.models || [];
    console.log(`✅ Found ${models.length} total models`);

    const pageModels = models.filter((m) => m.kind === "page");
    console.log(`✅ Found ${pageModels.length} page-kind models:`);
    for (const m of pageModels) {
      const displayName = m.everything?.displayName || m.name;
      const gqlName = toGraphQLFieldName(m.name);
      console.log(`   - name: "${m.name}" -> gql: "${gqlName}", displayName: "${displayName}"`);
    }

    return pageModels;
  } catch (err) {
    console.error("❌ Admin API query failed:", err.message);
    return [];
  }
}

// ── Test 2: Content API v3 GraphQL - Fetch page content ──────────────

async function testContentApiGetPages(modelName) {
  const graphqlFieldName = toGraphQLFieldName(modelName);
  console.log(`\n── Content API: "${modelName}" -> "${graphqlFieldName}" ──`);

  const query = `query {
    ${graphqlFieldName} {
      id
      name
      published
      everything
    }
  }`;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://cdn.builder.io/api/v3/graphql/${PUBLIC_KEY}?query=${encodedQuery}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error(
        `❌ FAILED:`,
        result.errors?.[0]?.message || response.statusText || "Unknown error"
      );
      return false;
    }

    const content = result.data?.[graphqlFieldName] || [];
    console.log(`✅ Success! Found ${content.length} entries`);
    if (content.length > 0) {
      console.log(`   First entry: id="${content[0].id}", name="${content[0].name}"`);
    }
    return true;
  } catch (err) {
    console.error(`❌ Fetch failed:`, err.message);
    return false;
  }
}

// ── Test 3: GraphQL introspection ────────────────────────────────────

async function testGraphQLIntrospection() {
  console.log("\n═══ Test 3: GraphQL Introspection ═══");

  const query = `{
    __schema {
      queryType {
        fields {
          name
        }
      }
    }
  }`;

  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://cdn.builder.io/api/v3/graphql/${PUBLIC_KEY}?query=${encodedQuery}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();

    if (!response.ok || result.errors) {
      console.error("❌ Introspection failed:", result.errors?.[0]?.message || response.statusText);
      return [];
    }

    const fields = result.data?.__schema?.queryType?.fields || [];
    console.log(`✅ Available query fields (${fields.length}):`);
    for (const f of fields) {
      console.log(`   - ${f.name}`);
    }
    return fields.map((f) => f.name);
  } catch (err) {
    console.error("❌ Introspection fetch failed:", err.message);
    return [];
  }
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Builder.io GraphQL Query Test Harness");
  console.log("=====================================");

  // Step 1: Introspection to see what's available
  const availableFields = await testGraphQLIntrospection();

  // Step 2: Admin API to discover page-kind models
  const pageModels = await testAdminApiGetModels();

  if (pageModels.length === 0) {
    console.log("\nNo page models found. Check your private key.");
    return;
  }

  // Step 3: Test content API for each page model (with camelCase conversion)
  console.log("\n═══ Test 2: Content API - Fetch Page Content ═══");

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const model of pageModels) {
    const gqlName = toGraphQLFieldName(model.name);

    // Check if the model exists in the GraphQL schema
    if (availableFields.length > 0 && !availableFields.includes(gqlName)) {
      console.log(`\n── Skipping "${model.name}" -> "${gqlName}" (not in GraphQL schema) ──`);
      skipped++;
      continue;
    }

    const success = await testContentApiGetPages(model.name);
    if (success) passed++;
    else failed++;
  }

  console.log(`\n═══ Summary ═══`);
  console.log(`Page models: ${pageModels.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Skipped (not in schema): ${skipped}`);
}

main().catch(console.error);
