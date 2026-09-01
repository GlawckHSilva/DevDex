
import { getPublicStatus } from "@/db";
import { getBetaConfig } from "@/lib/runtime-config";

export const metadata = { title: "Status do projeto" };
export const dynamic = "force-dynamic";

export default async function Status() {
  const status = await getPublicStatus();
  const beta = getBetaConfig();
  return <main className="app-page container">
    <header className="app-header"><a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a><a className="back" href="/">← Voltar ao início</a></header>
    <span className="kicker">PROJECT STATUS</span><h2>DevDex Public Beta v0.3</h2>
    <div className="status-grid"><div className="status-card"><span>Currículo publicado</span><strong>{status.missions} missões · {status.paths} trilhas</strong></div><div className="status-card"><span>Execução isolada</span><strong>{status.runtimes} runtimes</strong></div><div className="status-card"><span>Project Mode</span><strong>{status.projects} projeto · {status.projectSteps} etapas</strong></div></div>
    <p className="notice">Beta {beta.enabled ? "aberta" : "pausada"} para usuários autenticados. As seis tecnologias são campanhas RPG independentes com personagem, três vidas, pesquisa, elites e bosses, sempre sem armazenar o código-fonte.</p>
  </main>;
}
