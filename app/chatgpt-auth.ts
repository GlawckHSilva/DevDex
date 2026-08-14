import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BetaAccessError, ensureUser } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  if (!userId || !email) return null;
  const encodedName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName = encodedName && requestHeaders.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8" ? safeDecode(encodedName) : null;
  return { userId, email, fullName, displayName: fullName ?? email };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (!user) redirect(`/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`);
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) redirect(`/beta-indisponivel?reason=${error.reason}`);
    throw error;
  }
  return user;
}

export async function requireAdminUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (!isAdminEmail(user.email)) redirect("/dashboard");
  return user;
}

export function chatGPTSignOutPath(returnTo = "/") {
  return `/signout-with-chatgpt?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`;
}

function safeReturnPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch { return "/"; }
}

function safeDecode(value: string) { try { return decodeURIComponent(value); } catch { return null; } }
