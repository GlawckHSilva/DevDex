import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, createGitHubConnectionState, ensureUser } from "@/db";
import { getGitHubInstallUrl } from "@/lib/github-app";

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.redirect(new URL(`/signin-with-chatgpt?return_to=${encodeURIComponent(new URL(request.url).pathname + new URL(request.url).search)}`, request.url));
  try { await ensureUser(user); }
  catch (error) { if (error instanceof BetaAccessError) return Response.redirect(new URL(`/beta-indisponivel?reason=${error.reason}`, request.url)); throw error; }
  const requested = new URL(request.url).searchParams.get("return_to") ?? "/dashboard";
  const returnPath = /^\/projetos\/[a-z0-9-]+(?:\?[^\s]*)?$/.test(requested) ? requested : "/dashboard";
  try {
    const state = await createGitHubConnectionState(user.userId, returnPath);
    return Response.redirect(getGitHubInstallUrl(state));
  } catch {
    return Response.json({ message: "A conexão privada do GitHub ainda não está configurada." }, { status: 503 });
  }
}
