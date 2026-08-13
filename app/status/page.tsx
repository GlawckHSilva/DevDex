import Link from "next/link";

export const metadata = { title: "Status do projeto" };

export default function Status() {
  return <main className="app-page container">
    <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">D_</span>DevDex</Link><Link className="back" href="/">← Voltar ao início</Link></header>
    <span className="kicker">PROJECT STATUS</span><h2>Fase 1A — JavaScript Fundamentals</h2>
    <div className="status-grid"><div className="status-card"><span>Implementado</span><strong>5 missões + XP</strong></div><div className="status-card"><span>Persistência</span><strong>D1 versionado</strong></div><div className="status-card"><span>Próximo</span><strong>Runtime SQL</strong></div></div>
    <p className="notice">A trilha JavaScript funciona ponta a ponta com SIWC, QuickJS e progresso persistente. React, Python, Flutter, mentor IA e projetos avançados permanecem fora desta etapa.</p>
  </main>;
}
