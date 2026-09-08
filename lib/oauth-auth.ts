import { getOAuthConfig } from "@/lib/runtime-config";

export type AuthProvider = "google" | "github";
export type ExternalUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  provider: AuthProvider;
};

type OAuthState = { provider: AuthProvider; state: string; verifier: string; returnTo: string; exp: number };
type Session = ExternalUser & { exp: number };

const encoder = new TextEncoder();
const sessionCookie = "devdex_session";

export function providerCookie(provider: AuthProvider) { return `devdex_oauth_${provider}`; }
export function safeReturnPath(value: string | null | undefined) {
  if (!value?.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch { return "/"; }
}

export function randomToken(bytes = 32) {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return base64Url(value);
}

export async function codeChallenge(verifier: string) {
  return base64Url(new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(verifier))));
}

export async function createOAuthState(payload: OAuthState) { return sign(payload); }
export async function readOAuthState(cookieHeader: string | null, provider: AuthProvider) {
  return verify<OAuthState>(readCookie(cookieHeader, providerCookie(provider)));
}

export async function createSession(user: ExternalUser) {
  return sign<Session>({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 });
}

export async function readExternalUser(cookieHeader: string | null): Promise<ExternalUser | null> {
  const session = await verify<Session>(readCookie(cookieHeader, sessionCookie));
  if (!session || (session.provider !== "google" && session.provider !== "github")) return null;
  return session;
}

export function authCookie(name: string, value: string, requestUrl: string, maxAge: number) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearAuthCookie(name: string, requestUrl: string) { return authCookie(name, "", requestUrl, 0); }
export { sessionCookie };

async function sign<T extends object>(payload: T) {
  const encoded = base64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await hmac(encoded);
  return `${encoded}.${base64Url(signature)}`;
}

async function verify<T extends { exp: number }>(value: string | null): Promise<T | null> {
  if (!value) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return null;
  try {
    const expected = await hmac(payload);
    const actual = base64UrlDecode(signature);
    if (!constantTimeEqual(actual, expected)) return null;
    const parsed = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload))) as T;
    return parsed.exp > Date.now() ? parsed : null;
  } catch { return null; }
}

async function hmac(value: string) {
  const secret = getOAuthConfig().sessionSecret;
  if (!secret) throw new Error("AUTH_SESSION_SECRET ausente.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function readCookie(header: string | null, name: string) {
  const item = header?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!item) return null;
  try { return decodeURIComponent(item.slice(name.length + 1)); } catch { return null; }
}

function base64Url(value: Uint8Array) {
  let binary = "";
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}
