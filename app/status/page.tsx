import Link from "next/link";

export const metadata = { title: "Status do projeto" };

export default function Status() {
  return <main className="app-page container">
    <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">D_</span>DevDex</Link><Link className="back" href="/">← Voltar ao início</Link></header>
    <span className="kicker">PROJECT STATUS</span><h2>Fase 1B — JavaScript + SQLite</h2>
    <div className="status-grid"><div className="status-card"><span>Implementado</span><strong>11 missões + XP</strong></div><div className="status-card"><span>Runtimes</span><strong>QuickJS + SQLite</strong></div><div className="status-card"><span>Próximo</span><strong>HTML/CSS</strong></div></div>
    <p className="notice">JavaScript e SQL Fundamentals · SQLite funcionam ponta a ponta com sandboxes independentes. React, Python, Flutter, mentor IA e projetos avançados permanecem fora desta etapa.</p>
  </main>;
}
