import { sign } from "node:crypto";
import { getGitHubAppConfig } from "@/lib/runtime-config";

const API = "https://api.github.com";

function base64url(value: string | Uint8Array) {
  const binary = typeof value === "string" ? value : String.fromCharCode(...value);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function appJwt() {
  const config = getGitHubAppConfig();
  if (!config.enabled) throw new Error("A GitHub App ainda não está configurada.");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify({ iat: now - 30, exp: now + 540, iss: config.appId }))}`;
  return `${unsigned}.${base64url(sign("sha256", Buffer.from(unsigned), config.privateKey))}`;
}

function headers(token: string) {
  return { Accept: "application/vnd.github+json", Authorization: `Bearer ${token}`, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "DevDex-Project-Review" };
}

export function getGitHubInstallUrl(state: string) {
  const config = getGitHubAppConfig();
  if (!config.enabled) throw new Error("A GitHub App ainda não está configurada.");
  return `https://github.com/apps/${encodeURIComponent(config.slug)}/installations/new?state=${encodeURIComponent(state)}`;
}

export async function exchangeAndVerifyInstallation(code: string, installationId: number, fetcher: typeof fetch = fetch) {
  const config = getGitHubAppConfig();
  if (!config.enabled) throw new Error("A GitHub App ainda não está configurada.");
  const tokenResponse = await fetcher("https://github.com/login/oauth/access_token", {
    method: "POST", headers: { Accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code }), signal: AbortSignal.timeout(10_000),
  });
  const tokenBody = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !tokenBody.access_token) throw new Error("O GitHub não confirmou a autorização.");
  const installationsResponse = await fetcher(`${API}/user/installations?per_page=100`, { headers: headers(tokenBody.access_token), signal: AbortSignal.timeout(10_000) });
  const body = await installationsResponse.json() as { installations?: { id: number; account?: { login?: string; type?: string } }[] };
  const installation = body.installations?.find((item) => item.id === installationId);
  if (!installationsResponse.ok || !installation?.account?.login) throw new Error("Essa instalação não pertence ao usuário autorizado.");
  return { installationId, accountLogin: installation.account.login, accountType: installation.account.type ?? "User" };
}

export async function createInstallationToken(installationId: number, fetcher: typeof fetch = fetch) {
  const response = await fetcher(`${API}/app/installations/${installationId}/access_tokens`, {
    method: "POST", headers: { ...headers(appJwt()), "content-type": "application/json" },
    body: JSON.stringify({ permissions: { contents: "read" } }), signal: AbortSignal.timeout(10_000),
  });
  const body = await response.json() as { token?: string };
  if (!response.ok || !body.token) throw new Error("Não foi possível acessar a instalação da GitHub App.");
  return body.token;
}
