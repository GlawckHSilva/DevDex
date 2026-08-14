import { requireAdminUser } from "@/app/chatgpt-auth";
import { getAdminMetrics } from "@/db";

export const metadata = { title: "Métricas da beta" };
export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  await requireAdminUser("/admin/metricas");
  const { summary, missions, runtimes, projects, battles } = await getAdminMetrics();
  const errorRate = summary.submissions ? Math.round((summary.runnerErrors / summary.submissions) * 100) : 0;
  return <main className="app-page container metrics-page">
    <header className="app-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><a className="back" href="/dashboard">← Dashboard</a></header>
    <span className="kicker">ADMIN · PUBLIC BETA</span><h1>Métricas de aprendizagem</h1>
    <div className="status-grid"><div className="status-card"><span>Usuários</span><strong>{summary.totalUsers}</strong><small>{summary.activeUsers7d} ativos em 7 dias</small></div><div className="status-card"><span>Missões</span><strong>{summary.missionCompletions}/{summary.missionStarts}</strong><small>concluídas/iniciadas</small></div><div className="status-card"><span>Execuções</span><strong>{summary.submissions}</strong><small>{errorRate}% de erros · média {summary.averageDurationMs} ms</small></div></div>
    <section className="metrics-section"><h2>Runtimes</h2><div className="metric-table-wrap"><table className="metric-table"><thead><tr><th>Runtime</th><th>Execuções</th><th>Erros</th><th>Tempo médio</th></tr></thead><tbody>{runtimes.map((item) => <tr key={item.runtime}><td>{item.runtime}</td><td>{item.attempts}</td><td>{item.errors}</td><td>{item.averageDurationMs} ms</td></tr>)}</tbody></table></div></section>
    <section className="metrics-section"><h2>Dificuldade por missão</h2><div className="metric-table-wrap"><table className="metric-table"><thead><tr><th>Missão</th><th>Runtime</th><th>Tentativas</th><th>Derrotas</th><th>Concluída</th><th>Taxa de erro</th><th>Média</th></tr></thead><tbody>{missions.map((item) => <tr key={`${item.runtime}-${item.title}`}><td>{item.title}</td><td>{item.runtime}</td><td>{item.attempts}</td><td>{item.defeats}</td><td>{item.completions}</td><td>{item.attempts ? Math.round((item.errors / item.attempts) * 100) : 0}%</td><td>{item.averageDurationMs} ms</td></tr>)}</tbody></table></div></section>
    <section className="metrics-section"><h2>Batalhas da primeira zona</h2><div className="metric-table-wrap"><table className="metric-table"><thead><tr><th>Inimigo</th><th>Tipo</th><th>Batalhas</th><th>Vitórias</th><th>Derrotas</th><th>Pesquisas</th><th>Vidas perdidas</th><th>Tempo médio</th></tr></thead><tbody>{battles.map((item) => <tr key={item.enemyName}><td>{item.enemyName}</td><td>{item.enemyType}</td><td>{item.battles}</td><td>{item.victories}</td><td>{item.defeats}</td><td>{item.researches}</td><td>{item.averageLivesLost}</td><td>{item.averageDurationSeconds}s</td></tr>)}</tbody></table></div></section>
    <p className="notice">Project Mode: {projects.attempts} validações, {projects.passed} aprovadas, {projects.errors} erros, média de {projects.averageDurationMs} ms. Nenhuma métrica armazena o código-fonte do aluno.</p>
  </main>;
}
