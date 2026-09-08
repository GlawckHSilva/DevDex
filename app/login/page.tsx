import { redirect } from "next/navigation";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { LoginExperience } from "@/app/login/login-experience";
import { safeReturnPath } from "@/lib/oauth-auth";
import { getOAuthConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ return_to?: string; erro?: string }> }) {
  const query = await searchParams;
  const returnTo = safeReturnPath(query.return_to);
  if (await getChatGPTUser()) redirect(returnTo);
  const providers = getOAuthConfig();
  const error = query.erro ? errorMessage(query.erro) : null;

  return <LoginExperience
    error={error}
    googleEnabled={providers.google.enabled}
    githubEnabled={providers.github.enabled}
    googleUrl={`/auth/google?return_to=${encodeURIComponent(returnTo)}`}
    githubUrl={`/auth/github?return_to=${encodeURIComponent(returnTo)}`}
    chatgptUrl={chatGPTSignInPath(returnTo)}
  />;
}

function errorMessage(error: string) {
  if (error.endsWith("_indisponivel")) return "Esse provedor ainda precisa ser configurado pelo administrador.";
  if (error === "retorno_invalido") return "A autorização expirou ou não pôde ser validada. Tente novamente.";
  return "Não foi possível entrar com esse provedor. Tente novamente.";
}
