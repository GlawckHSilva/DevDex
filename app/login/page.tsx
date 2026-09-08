import { redirect } from "next/navigation";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { Bot } from "lucide-react";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
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

  return <main className="login-page">
    <section className="login-card" aria-labelledby="login-title">
      <a className="brand" href="/"><span className="brand-mark">D_</span><span>DevDex</span></a>
      <span className="kicker">CONTINUE SUA JORNADA</span>
      <h1 id="login-title">Entre no DevDex</h1>
      <p>Escolha como acessar. Seu progresso fica vinculado ao e-mail verificado da conta.</p>
      {error && <div className="login-error" role="alert">{error}</div>}
      <div className="login-options">
        <a className="login-provider login-google" href={`/auth/google?return_to=${encodeURIComponent(returnTo)}`} aria-disabled={!providers.google.enabled}><FaGoogle aria-hidden="true" /> Continuar com Google{!providers.google.enabled && <small>Configuração pendente</small>}</a>
        <a className="login-provider" href={`/auth/github?return_to=${encodeURIComponent(returnTo)}`} aria-disabled={!providers.github.enabled}><FaGithub aria-hidden="true" /> Continuar com GitHub{!providers.github.enabled && <small>Configuração pendente</small>}</a>
        <a className="login-provider" href={chatGPTSignInPath(returnTo)} target="_top"><Bot aria-hidden="true" /> Continuar com ChatGPT</a>
      </div>
      <a className="login-back" href="/">← Voltar ao início</a>
    </section>
  </main>;
}

function errorMessage(error: string) {
  if (error.endsWith("_indisponivel")) return "Esse provedor ainda precisa ser configurado pelo administrador.";
  if (error === "retorno_invalido") return "A autorização expirou ou não pôde ser validada. Tente novamente.";
  return "Não foi possível entrar com esse provedor. Tente novamente.";
}
