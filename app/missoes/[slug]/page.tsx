import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getMission } from "@/db";
import { MissionWorkspace } from "./workspace";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MissionContent slug={slug} />;
}

async function MissionContent({ slug }: { slug: string }) {
  const user = await requireChatGPTUser(`/missoes/${slug}`);
  await ensureUser(user);
  const mission = await getMission(user.userId, slug);
  if (!mission) notFound();
  if (mission.state === "locked") return <main className="app-page container"><Link className="back" href="/dashboard">← Dashboard</Link><h2>Missão bloqueada</h2><p className="notice">Conclua a missão anterior para liberar este desafio.</p></main>;

  return <main className="workspace-page">
    <header className="workspace-header"><Link className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</Link><div><small>JAVASCRIPT FUNDAMENTALS</small><strong>{mission.title}</strong></div><span className="workspace-xp">+{mission.xpReward} XP</span></header>
    <MissionWorkspace mission={{ slug: mission.slug, title: mission.title, briefing: mission.briefing, objective: mission.objective, starterCode: mission.starterCode, functionName: mission.functionName, completed: mission.state === "completed", nextMissionSlug: mission.nextMissionSlug }} />
  </main>;
}
