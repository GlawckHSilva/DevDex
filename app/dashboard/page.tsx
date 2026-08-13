import Link from "next/link";

export const metadata = { title: "Dashboard" };

export default function Dashboard() {
  return <main className="app-page container">
    <header className="app-header"><Link className="brand" href="/"><span className="brand-mark">D_</span>DevDex</Link><Link className="back" href="/">← Voltar ao início</Link></header>
    <span className="kicker">DASHBOARD · FUNDAÇÃO</span><h2>Base pronta para receber o progresso real.</h2>
    <div className="status-grid"><div className="status-card"><span>Trilhas do MVP</span><strong>4</strong></div><div className="status-card"><span>Schema versionado</span><strong>PostgreSQL</strong></div><div className="status-card"><span>Motor de execução</span><strong>Próxima etapa</strong></div></div>
    <p className="notice">Este é um estado honesto da Fase 0: nenhum XP ou progresso fictício foi criado. Os dados aparecerão após a conexão do Supabase e a implementação do primeiro fluxo vertical.</p>
  </main>;
}
