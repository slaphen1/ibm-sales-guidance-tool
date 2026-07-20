/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker / Code Engine deployment — produces a minimal standalone build
  output: "standalone",

  // Server-side env vars (never exposed to the browser)
  serverRuntimeConfig: {
    askSalesApiUrl: process.env.ASKSALES_API_URL,
    askSalesApiKey: process.env.ASKSALES_API_KEY,
    askSalesClientId: process.env.ASKSALES_CLIENT_ID,
    askSalesClientSecret: process.env.ASKSALES_CLIENT_SECRET,
    watsonAssistantUrl: process.env.WATSON_ASSISTANT_URL,
    watsonAssistantMessageUrl: process.env.WATSON_ASSISTANT_MESSAGE_URL,
    watsonAssistantApiKey: process.env.WATSON_ASSISTANT_API_KEY,
    watsonAssistantId: process.env.WATSON_ASSISTANT_ID,
    watsonAssistantSkillId: process.env.WATSON_ASSISTANT_SKILL_ID,
    watsonAssistantEnvironmentId: process.env.WATSON_ASSISTANT_ENVIRONMENT_ID,
    watsonAssistantProdEnvironmentId: process.env.WATSON_ASSISTANT_PROD_ENVIRONMENT_ID,
    watsonAssistantVersion: process.env.WATSON_ASSISTANT_VERSION ?? "2024-08-25",
    watsonxApiKey: process.env.AI_API_KEY,
    watsonxProjectId: process.env.WATSONX_PROJECT_ID,
    watsonxUrl: process.env.WATSONX_URL,
    watsonxModel: process.env.AI_MODEL,
    crmApiUrl: process.env.CRM_API_URL,
    crmApiKey: process.env.CRM_API_KEY,
  },
  // Public env vars (safe to expose to the browser)
  publicRuntimeConfig: {
    frontendUrl: process.env.FRONTEND_URL,
  },
};

export default nextConfig;
