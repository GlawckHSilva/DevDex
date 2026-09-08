import { getOAuthConfig } from "@/lib/runtime-config";
import { authCookie, codeChallenge, createOAuthState, providerCookie, randomToken, safeReturnPath, type AuthProvider } from "@/lib/oauth-auth";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const provider = (await params).provider as AuthProvider;
  if (provider !== "google" && provider !== "github") return Response.json({ message: "Provedor inválido." }, { status: 404 });
  const config = getOAuthConfig()[provider];
  const requestUrl = new URL(request.url);
  if (!config.enabled) return Response.redirect(new URL(`/login?erro=${provider}_indisponivel&return_to=${encodeURIComponent(safeReturnPath(requestUrl.searchParams.get("return_to")))}`, request.url));

  const state = randomToken();
  const verifier = randomToken(48);
  const redirectUri = `${requestUrl.origin}/auth/${provider}/callback`;
  const stateCookie = await createOAuthState({ provider, state, verifier, returnTo: safeReturnPath(requestUrl.searchParams.get("return_to")), exp: Date.now() + 600_000 });
  const target = provider === "google"
    ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
    : new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id", config.clientId);
  target.searchParams.set("redirect_uri", redirectUri);
  target.searchParams.set("response_type", "code");
  target.searchParams.set("state", state);
  target.searchParams.set("code_challenge", await codeChallenge(verifier));
  target.searchParams.set("code_challenge_method", "S256");
  target.searchParams.set("scope", provider === "google" ? "openid email profile" : "read:user user:email");
  if (provider === "google") target.searchParams.set("prompt", "select_account");

  return new Response(null, { status: 302, headers: { Location: target.toString(), "Set-Cookie": authCookie(providerCookie(provider), stateCookie, request.url, 600) } });
}
