/**
 * test-watson-connection.mjs
 * Tests the Watson Assistant API using the exact endpoint from the API docs.
 *
 * Endpoint: POST /v2/assistants/{assistantId}/environments/{environmentId}/message
 * Auth:     Basic base64("user:<api_key>") — note: username is "user" not "apikey"
 *
 * Run with: node scripts/test-watson-connection.mjs
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Load .env file ────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath     = resolve(__dirname, "../.env");
  const examplePath = resolve(__dirname, "../.env.example");
  let filePath;
  try { readFileSync(envPath); filePath = envPath; console.log("📄 Using: .env"); }
  catch { try { readFileSync(examplePath); filePath = examplePath; console.log("📄 Using: .env.example"); } catch { console.error("✗ No .env found."); process.exit(1); } }
  const env = {};
  for (const line of readFileSync(filePath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx === -1) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();

const ASSISTANT_ID   = env.WATSON_ASSISTANT_ID    ?? "a99f67bd-26da-4ca3-b338-cbbb03bb3e57";
const ENVIRONMENT_ID = env.WATSON_ASSISTANT_ENVIRONMENT_ID ?? "4ec3f873-5e08-4a8f-b7d4-dd528622e808";
const API_KEY        = env.WATSON_ASSISTANT_API_KEY;
const VERSION        = "2024-08-25";  // confirmed from curl sample
const BASE_INSTANCE  = "https://api.us-east-1.aws.watsonassistant.ibm.com/instances/20250911-1453-2217-006b-ed3d70a0da56";

// Confirmed endpoint from curl sample
const URL = `${BASE_INSTANCE}/v2/assistants/${ASSISTANT_ID}/environments/${ENVIRONMENT_ID}/message?version=${VERSION}`;

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║  Watson Assistant — Connection Test                          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(`Endpoint     : ${URL}`);
console.log(`API Key      : ${API_KEY ? API_KEY.slice(0, 12) + "..." : "NOT SET"}`);
console.log("");

if (!API_KEY || API_KEY === "your-watson-assistant-api-key") {
  console.error("✗ WATSON_ASSISTANT_API_KEY is not set. Add it to your .env file.");
  process.exit(1);
}

// ── Build the exact payload from the curl sample ──────────────────────────────
const PAYLOAD = {
  input: {
    "message_type:": "text",  // note: keeping the typo exactly as in the sample
    text: "Tell me about watsonx orchestrate",
  },
  context: {
    skills: {
      "actions skill": {
        skill_variables: {
          source_system: "IBM-Bob",
          email_address: "test@ibm.com",
        },
      },
    },
  },
  user_id: "test@ibm.com",
};

// ── Auth strategies ───────────────────────────────────────────────────────────
// The curl says: "user and api key passed a base64 string"
// This suggests the format may be base64("user:<key>") not base64("apikey:<key>")
const strategies = [
  // Strategy A: base64("apikey:<key>") — standard IBM IAM format
  ["A — base64(apikey:<key>)",    `Basic ${Buffer.from(`apikey:${API_KEY}`).toString("base64")}`],
  // Strategy B: key is itself the base64 string — use directly
  ["B — Basic <key-as-is>",      `Basic ${API_KEY}`],
  // Strategy C: base64("user:<key>") — curl says "user and api key"
  ["C — base64(user:<key>)",     `Basic ${Buffer.from(`user:${API_KEY}`).toString("base64")}`],
  // Strategy D: Bearer token
  ["D — Bearer <key>",           `Bearer ${API_KEY}`],
];

// ── Run each strategy ─────────────────────────────────────────────────────────
async function tryStrategy(name, authHeader) {
  console.log(`Testing ${name}`);
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify(PAYLOAD),
    });
    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      const reply = data.output?.generic?.find(g => g.response_type === "text")?.text ?? "(no text)";
      console.log(`  ✅ SUCCESS (${res.status})`);
      console.log(`  Reply preview: ${reply.slice(0, 150)}...`);
      console.log(`\n  ✅ Working auth format: ${name}`);
      console.log(`  Auth header: ${authHeader.slice(0, 40)}...\n`);
      return true;
    } else {
      console.log(`  ✗ ${res.status}: ${text.slice(0, 150)}`);
      return false;
    }
  } catch (err) {
    console.log(`  ✗ Network error: ${err.message}`);
    return false;
  }
}

let success = false;
for (const [name, header] of strategies) {
  success = await tryStrategy(name, header);
  if (success) break;
  console.log("");
}

if (!success) {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✗ All strategies failed                                     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("\nNext steps:");
  console.log("  1. Confirm the API key in .env is the one from IBM 1Password");
  console.log("  2. Ensure you are not on a network that blocks outbound HTTPS");
  console.log("  3. Share the exact error with the IBM technical lead");
  process.exit(1);
}
