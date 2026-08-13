import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getLearningPath } from "@/db";

export const dynamic = "force-dynamic";

export default async function LearningPathPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/trilhas/${slug}`);
  const path = await getLearningPath(user, slug);
  if (!path) notFound();

  const completed = path.missions.filter((mission) => mission.state === "completed").length;
  const progress = Math.round((completed / path.missions.length) * 100);

  return <main className="app-page container path-page">
    <header className="app-header"><a className="back" href="/dashboard">← Dashboard</a><span className="kicker">TRILHA V{path.version}</span></header>
    <h1>{path.name}</h1><p className="path-description">{path.description}</p>
    <div className="progress-panel"><div><span>Progresso da trilha</span><strong>{progress}%</strong></div><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><small>{completed} de {path.missions.length} missões concluídas</small></div>
    <section className="path-missions" aria-label="Missões da trilha">
      {path.missions.map((mission, index) => {
        const content = <><span className={`mission-index state-${mission.state}`}>{mission.state === "completed" ? "✓" : String(index + 1).padStart(2, "0")}</span><div><small>{mission.skillName}</small><h2>{mission.title}</h2></div><span className="mission-reward">+{mission.xpReward} XP</span><span className="mission-action">{mission.state === "locked" ? "Bloqueada" : mission.state === "completed" ? "Revisar →" : "Começar →"}</span></>;
        return mission.state === "locked"
          ? <div className="mission-row mission-locked" key={mission.slug}>{content}</div>
          : <a className="mission-row" href={`/missoes/${mission.slug}`} key={mission.slug}>{content}</a>;
      })}
    </section>
  </main>;
}
