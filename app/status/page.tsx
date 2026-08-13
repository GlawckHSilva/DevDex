import Link from "next/link";

export const metadata = { title: "Status do projeto" };

export default function Status() {
  return <main className="app-page container">
    <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">D_</span>DevDex</Link><Link className="back" href="/">← Voltar ao início</Link></header>
    <span className="kicker">PROJECT STATUS</span><h2>Fase 0 — Fundação</h2>
    <div className="status-grid"><div className="status-card"><span>Implementado</span><strong>Missão + XP</strong></div><div className="status-card"><span>Persistência</span><strong>D1 versionado</strong></div><div className="status-card"><span>Próximo</span><strong>Runner isolado</strong></div></div>
    <p className="notice">A primeira missão já funciona ponta a ponta. React, Python, Flutter, mentor IA e projetos avançados permanecem fora desta etapa.</p>
  </main>;
}
