import { findProfileUserIdByEmail } from "@/db";
import { authCookie, clearAuthCookie, createSession, providerCookie, readOAuthState, safeReturnPath, sessionCookie, type AuthProvider, type ExternalUser } from "@/lib/oauth-auth";
import { getOAuthConfig } from "@/lib/runtime-config";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider as AuthProvider;
  if (provider !== "google" && provider !== "github") return Response.json({ message: "Provedor inválido." }, { status: 404 });
  const url = new URL(request.url);
  const state = await readOAuthState(request.headers.get("cookie"), provider);
  if (!state || state.provider !== provider || state.state !== url.searchParams.get("state") || !url.searchParams.get("code")) return loginError(request, provider, "retorno_invalido");

  try {
    const identity = provider === "google"
      ? await googleIdentity(url.searchParams.get("code")!, state.verifier, `${url.origin}/auth/google/callback`)
      : await githubIdentity(url.searchParams.get("code")!, state.verifier, `${url.origin}/auth/github/callback`);
    const userId = await findProfileUserIdByEmail(identity.email) ?? `${provider}:${identity.subject}`;
    const user: ExternalUser = { userId, email: identity.email, displayName: identity.name, fullName: identity.name, provider };
    const response = new Response(null, { status: 302, headers: { Location: new URL(safeReturnPath(state.returnTo), url.origin).toString() } });
    response.headers.append("Set-Cookie", authCookie(sessionCookie, await createSession(user), request.url, 60 * 60 * 24 * 30));
    response.headers.append("Set-Cookie", clearAuthCookie(providerCookie(provider), request.url));
    return response;
  } catch { return loginError(request, provider, "falha_autenticacao"); }
}

async function googleIdentity(code: string, verifier: string, redirectUri: string) {
  const config = getOAuthConfig().google;
  const token = await postForm("https://oauth2.googleapis.com/token", { code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code", code_verifier: verifier });
  const profile = await fetchJson<{ sub?: string; email?: string; email_verified?: boolean; name?: string }>("https://openidconnect.googleapis.com/v1/userinfo", token.access_token);
  if (!profile.sub || !profile.email || !profile.email_verified) throw new Error("Conta Google sem e-mail verificado.");
  return { subject: profile.sub, email: profile.email, name: profile.name?.trim() || profile.email };
}

async function githubIdentity(code: string, verifier: string, redirectUri: string) {
  const config = getOAuthConfig().github;
  const token = await postForm("https://github.com/login/oauth/access_token", { code, client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: redirectUri, code_verifier: verifier });
  const profile = await fetchJson<{ id?: number; name?: string | null; login?: string }>("https://api.github.com/user", token.access_token, true);
  const emails = await fetchJson<Array<{ email: string; verified: boolean; primary: boolean }>>("https://api.github.com/user/emails", token.access_token, true);
  const email = emails.find((item) => item.primary && item.verified)?.email ?? emails.find((item) => item.verified)?.email;
  if (!profile.id || !email) throw new Error("Conta GitHub sem e-mail verificado.");
  return { subject: String(profile.id), email, name: profile.name?.trim() || profile.login || email };
}

async function postForm(url: string, values: Record<string, string>) {
  const response = await fetch(url, { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(values) });
  const result = await response.json() as { access_token?: string };
  if (!response.ok || !result.access_token) throw new Error("Token OAuth inválido.");
  return { access_token: result.access_token };
}

async function fetchJson<T>(url: string, token: string, github = false) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: github ? "application/vnd.github+json" : "application/json", ...(github ? { "User-Agent": "DevDex", "X-GitHub-Api-Version": "2022-11-28" } : {}) } });
  if (!response.ok) throw new Error("Não foi possível validar a identidade.");
  return response.json() as Promise<T>;
}

function loginError(request: Request, provider: AuthProvider, error: string) {
  return new Response(null, { status: 302, headers: { Location: new URL(`/login?erro=${error}`, request.url).toString(), "Set-Cookie": clearAuthCookie(providerCookie(provider), request.url) } });
}
