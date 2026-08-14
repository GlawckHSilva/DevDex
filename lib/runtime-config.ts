import { env } from "cloudflare:workers";

type RuntimeEnv = {
  PUBLIC_BETA_ENABLED?: string;
  PUBLIC_BETA_MAX_USERS?: string;
  DEVDEX_ADMIN_EMAIL?: string;
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

export function isAdminEmail(email: string) {
  const { adminEmail } = getBetaConfig();
  return adminEmail.length > 0 && email.toLowerCase() === adminEmail;
}
