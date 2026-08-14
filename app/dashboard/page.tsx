import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDashboard, getProjectSummaries } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireChatGPTUser("/dashboard");
  const { profile, missions } = await getDashboard(user);
  const projects = await getProjectSummaries(user.userId);
  const paths = Object.values(Object.groupBy(missions, (mission) => mission.pathSlug ?? "trilha")).map((pathMissions) => {
    const items = pathMissions ?? [];
    const completed = items.filter((mission) => mission.state === "completed").length;
    return { slug: items[0]?.pathSlug ?? "", name: items[0]?.pathName ?? "Trilha", completed, total: items.length, progress: Math.round((completed / items.length) * 100) };
  });

  return <main className="dashboard-shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a>
      <nav aria-label="Área do aluno"><a className="sidebar-active" href="/dashboard">⌂ Visão geral</a><a href="/projetos/lista-de-tarefas">▣ Project Mode</a><a href="/trilhas/html-fundamentals">◇ HTML</a><a href="/trilhas/css-fundamentals">◇ CSS</a><a href="/trilhas/javascript-fundamentals">◇ JavaScript</a><a href="/trilhas/sql-fundamentals-sqlite">◇ SQL · SQLite</a>{isAdminEmail(user.email) ? <a href="/admin/metricas">◉ Métricas</a> : null}<span>☆ Conquistas</span></nav>
      <a className="signout" href={chatGPTSignOutPath("/")}>Sair</a>
    </aside>
    <section className="dashboard-content">
      <header className="dashboard-top"><div><span className="kicker">CENTRAL DO AVENTUREIRO</span><h1>Olá, {user.displayName.split("@")[0]}.</h1></div><div className="level-chip"><small>NÍVEL {profile.level}</small><strong>{profile.totalXp} XP</strong></div></header>
      <div className="path-progress-grid">{paths.map((path) => <a className="progress-panel" href={`/trilhas/${path.slug}`} key={path.slug}><div><span>{path.name}</span><strong>{path.progress}%</strong></div><div className="progress-track"><i style={{ width: `${path.progress}%` }} /></div><small>{path.completed} de {path.total} missões concluídas</small></a>)}</div>
      <div className="mission-list-heading"><div><span className="kicker">PROJECTS</span><h2>Construa algo real</h2></div><span>{projects.length} projeto</span></div>
      <div className="project-card-grid">{projects.map((project) => <a className={`project-card state-${project.state}`} href={`/projetos/${project.slug}`} key={project.slug}><span>{project.state === "completed" ? "🏆 CONCLUÍDO" : "PROJECT MODE"}</span><h3>{project.title}</h3><p>{project.description}</p><div><small>{project.completedSteps}/{project.totalSteps} etapas</small><strong>{project.xpReward} XP</strong></div></a>)}</div>
      <div className="mission-list">
        <div className="mission-list-heading"><div><span className="kicker">MISSÕES</span><h2>Continue sua jornada</h2></div><span>{missions.length} missões</span></div>
        {missions.map((mission, index) => {
          const enabled = mission.state !== "locked";
          const card = <><span className={`mission-index state-${mission.state}`}>{mission.state === "completed" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{mission.skillName}</small><h3>{mission.title}</h3></div><span className="mission-reward">+{mission.xpReward} XP</span><span className="mission-action">{mission.state === "locked" ? "Bloqueada" : mission.state === "completed" ? "Revisar →" : "Iniciar →"}</span></>;
          return enabled ? <a className="mission-row" href={`/missoes/${mission.slug}`} key={mission.slug}>{card}</a> : <div className="mission-row mission-locked" key={mission.slug}>{card}</div>;
        })}
      </div>
    </section>
  </main>;
}
