import { env } from "cloudflare:workers";

type RuntimeEnv = {
  PUBLIC_BETA_ENABLED?: string;
  PUBLIC_BETA_MAX_USERS?: string;
  DEVDEX_ADMIN_EMAIL?: string;
  GITHUB_APP_ID?: string;
  GITHUB_APP_SLUG?: string;
  GITHUB_APP_CLIENT_ID?: string;
  GITHUB_APP_CLIENT_SECRET?: string;
  GITHUB_APP_PRIVATE_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_REVIEW_MODEL?: string;
};

export function getBetaConfig() {
  const runtime = env as RuntimeEnv;
  const parsedLimit = Number.parseInt(runtime.PUBLIC_BETA_MAX_USERS ?? "0", 10);
  return {
    enabled: runtime.PUBLIC_BETA_ENABLED !== "false",
    maxUsers: Number.isFinite(parsedLimit) && parsedLimit >= 0 ? parsedLimit : 0,
    adminEmail: runtime.DEVDEX_ADMIN_EMAIL?.trim().toLowerCase() ?? "",
  };
}

export function getGitHubAppConfig() {
  const runtime = env as RuntimeEnv;
  const config = {
    appId: runtime.GITHUB_APP_ID?.trim() ?? "",
    slug: runtime.GITHUB_APP_SLUG?.trim() ?? "",
    clientId: runtime.GITHUB_APP_CLIENT_ID?.trim() ?? "",
    clientSecret: runtime.GITHUB_APP_CLIENT_SECRET?.trim() ?? "",
    privateKey: runtime.GITHUB_APP_PRIVATE_KEY?.replaceAll("\\n", "\n").trim() ?? "",
  };
  return { ...config, enabled: Object.values(config).every(Boolean) };
}

export function getAIReviewConfig() {
  const runtime = env as RuntimeEnv;
  const apiKey = runtime.OPENAI_API_KEY?.trim() ?? "";
  return { apiKey, model: runtime.OPENAI_REVIEW_MODEL?.trim() || "gpt-5.4-mini", enabled: apiKey.length > 0 };
}

export function isAdminEmail(email: string) {
  const { adminEmail } = getBetaConfig();
  return adminEmail.length > 0 && email.toLowerCase() === adminEmail;
}
