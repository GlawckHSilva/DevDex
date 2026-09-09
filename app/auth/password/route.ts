import { findProfileUserIdByEmail } from "@/db";
import { authCookie, createSession, safeReturnPath, sessionCookie, type ExternalUser } from "@/lib/oauth-auth";
import { getPasswordAuthConfig } from "@/lib/runtime-config";

type Action = "login" | "signup" | "reset";
type FirebaseToken = { idToken: string; localId: string; email: string };
type FirebaseUser = { localId: string; email: string; emailVerified?: boolean; displayName?: string };

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  if (request.headers.get("origin") !== origin || !request.headers.get("content-type")?.startsWith("application/json")) return reply("Requisição inválida.", 403);
  const config = getPasswordAuthConfig();
  if (!config.enabled) return reply("O acesso por e-mail ainda não está disponível.", 503);

  try {
    const body = await request.json() as { action?: Action; name?: string; email?: string; password?: string; returnTo?: string };
    const action = body.action;
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!isEmail(email)) return reply("Digite um e-mail válido.", 400);
    if (action === "reset") {
      await firebase("accounts:sendOobCode", config.apiKey, { requestType: "PASSWORD_RESET", email, continueUrl: `${origin}/login` }).catch(() => null);
      return Response.json({ ok: true, message: "Se esse e-mail estiver cadastrado, você receberá as instruções de recuperação." });
    }
    if (action !== "login" && action !== "signup") return reply("Ação inválida.", 400);
    const password = body.password ?? "";
    if (password.length < 8 || password.length > 128) return reply("A senha deve ter entre 8 e 128 caracteres.", 400);

    if (action === "signup") {
      const name = body.name?.trim().replace(/\s+/g, " ") ?? "";
      if (name.length < 2 || name.length > 80) return reply("Digite seu nome.", 400);
      const created = await firebase<FirebaseToken>("accounts:signUp", config.apiKey, { email, password, returnSecureToken: true });
      await firebase("accounts:update", config.apiKey, { idToken: created.idToken, displayName: name, returnSecureToken: true });
      await firebase("accounts:sendOobCode", config.apiKey, { requestType: "VERIFY_EMAIL", idToken: created.idToken, continueUrl: `${origin}/login?verificado=1` });
      return Response.json({ ok: true, message: "Conta criada. Confirme seu e-mail e depois entre no DevDex." });
    }

    const token = await firebase<FirebaseToken>("accounts:signInWithPassword", config.apiKey, { email, password, returnSecureToken: true });
    const lookup = await firebase<{ users?: FirebaseUser[] }>("accounts:lookup", config.apiKey, { idToken: token.idToken });
    const identity = lookup.users?.[0];
    if (!identity?.emailVerified) {
      await firebase("accounts:sendOobCode", config.apiKey, { requestType: "VERIFY_EMAIL", idToken: token.idToken, continueUrl: `${origin}/login?verificado=1` }).catch(() => null);
      return reply("Confirme seu e-mail. Enviamos um novo link de verificação.", 403);
    }
    const userId = await findProfileUserIdByEmail(identity.email) ?? `password:${identity.localId}`;
    const displayName = identity.displayName?.trim() || identity.email;
    const user: ExternalUser = { userId, email: identity.email, displayName, fullName: identity.displayName?.trim() || null, provider: "password" };
    const response = Response.json({ ok: true, returnTo: safeReturnPath(body.returnTo) });
    response.headers.set("Set-Cookie", authCookie(sessionCookie, await createSession(user), request.url, 60 * 60 * 24 * 30));
    return response;
  } catch (error) {
    const code = error instanceof FirebaseError ? error.code : "";
    if (code === "EMAIL_EXISTS") return reply("Este e-mail já possui uma conta. Tente entrar ou recuperar a senha.", 409);
    if (["INVALID_LOGIN_CREDENTIALS", "EMAIL_NOT_FOUND", "INVALID_PASSWORD"].includes(code)) return reply("E-mail ou senha incorretos.", 401);
    if (code === "TOO_MANY_ATTEMPTS_TRY_LATER") return reply("Muitas tentativas. Aguarde alguns minutos.", 429);
    return reply("Não foi possível concluir. Tente novamente.", 502);
  }
}

async function firebase<T = unknown>(method: string, apiKey: string, body: object) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${method}?key=${encodeURIComponent(apiKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as T & { error?: { message?: string } };
  if (!response.ok) throw new FirebaseError(result.error?.message?.split(" : ")[0] ?? "FIREBASE_ERROR");
  return result;
}

class FirebaseError extends Error { constructor(public code: string) { super(code); } }
function isEmail(value: string) { return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function reply(message: string, status: number) { return Response.json({ ok: false, message }, { status }); }
