import { headers } from "next/headers";
import { redirect } from "next/navigation";

export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("oai-authenticated-user-id");
  const email = requestHeaders.get("oai-authenticated-user-email");
  // SIWC headers are injected by the hosted environment. A local preview has
  // no such proxy, so provide an explicitly development-only adventurer.
  // Production never takes this path.
  if (!userId || !email) {
    if (process.env.NODE_ENV === "development") {
      return {
        userId: "local-dev-user",
        email: "local@devdex.local",
        fullName: "Aventureiro local",
        displayName: "Aventureiro local",
      };
    }
    return null;
  }
  const encodedName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName = encodedName && requestHeaders.get("oai-authenticated-user-full-name-encoding") === "percent-encoded-utf-8" ? safeDecode(encodedName) : null;
  return { userId, email, fullName, displayName: fullName ?? email };
}

export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(`/signin-with-chatgpt?return_to=${encodeURIComponent(safeReturnPath(returnTo))}`);
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
