import Link from "next/link";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { getDashboard } from "@/db";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireChatGPTUser("/dashboard");
  const { profile, missions } = await getDashboard(user);
  const completed = missions.filter((mission) => mission.state === "completed").length;
  const progress = Math.round((completed / missions.length) * 100);

  return <main className="dashboard-shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">D_</span>DevDex</Link>
      <nav aria-label="Área do aluno"><Link className="sidebar-active" href="/dashboard">⌂ Visão geral</Link><span>◇ Skill tree</span><span>☆ Conquistas</span></nav>
      <a className="signout" href={chatGPTSignOutPath("/")}>Sair</a>
    </aside>
    <section className="dashboard-content">
      <header className="dashboard-top"><div><span className="kicker">CENTRAL DO AVENTUREIRO</span><h1>Olá, {user.displayName.split("@")[0]}.</h1></div><div className="level-chip"><small>NÍVEL {profile.level}</small><strong>{profile.totalXp} XP</strong></div></header>
      <div className="progress-panel"><div><span>JavaScript Fundamentals</span><strong>{progress}%</strong></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><small>{completed} de {missions.length} missões concluídas</small></div>
      <div className="mission-list">
        <div className="mission-list-heading"><div><span className="kicker">MISSÕES</span><h2>Continue sua jornada</h2></div><span>{missions.length} missões</span></div>
        {missions.map((mission, index) => {
          const enabled = mission.state !== "locked";
          const card = <><span className={`mission-index state-${mission.state}`}>{mission.state === "completed" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{mission.skillName}</small><h3>{mission.title}</h3></div><span className="mission-reward">+{mission.xpReward} XP</span><span className="mission-action">{mission.state === "locked" ? "Bloqueada" : mission.state === "completed" ? "Revisar →" : "Iniciar →"}</span></>;
          return enabled ? <Link className="mission-row" href={`/missoes/${mission.slug}`} key={mission.slug}>{card}</Link> : <div className="mission-row mission-locked" key={mission.slug}>{card}</div>;
        })}
      </div>
    </section>
  </main>;
}
