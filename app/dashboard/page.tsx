import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppSidebar } from "./sidebar";
import { getCampaignSummaries, getDashboard, getProjectSummaries, getUserReviewRecommendations } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await requireChatGPTUser("/dashboard");
  const [{ profile }, projects, campaigns, reviews] = await Promise.all([getDashboard(user), getProjectSummaries(user.userId), getCampaignSummaries(user.userId), getUserReviewRecommendations(user.userId, { limit: 3 })]);
  const activeCampaign = campaigns.find((campaign) => campaign.progress > 0 && campaign.progress < 100)
    ?? campaigns.find((campaign) => campaign.pathSlug === "github-fundamentals") ?? campaigns[0];

  return <main className="dashboard-shell">
    <AppSidebar campaigns={campaigns} skillPoints={profile.skillPoints} admin={isAdminEmail(user.email)} signOutHref={chatGPTSignOutPath("/")} />
    <section className="dashboard-content">
      <header className="dashboard-top"><div><span className="kicker">UNIVERSO DEVDEX</span><h1>Escolha sua próxima aventura, {user.displayName.split("@")[0]}.</h1></div><a className="level-chip" href="/habilidades"><small>NÍVEL GLOBAL {profile.level}</small><strong>{profile.withinLevel} / {profile.required} XP</strong><div className="progress-track"><i style={{ width: `${profile.percent}%` }} /></div><span>❤️ {profile.hearts}/{profile.maxHearts} · 💡 {profile.hints}/{profile.maxHints} · ◇ {profile.skillPoints}</span></a></header>
      {activeCampaign ? <section className={`campaign-continue theme-${activeCampaign.theme}`}><div><span className="kicker">CONTINUE SUA JORNADA · {activeCampaign.technologyName}</span><h2>{activeCampaign.title}</h2><p>Zona atual: <strong>{activeCampaign.zoneTitle}</strong></p><small>{activeCampaign.completedMissions}/{activeCampaign.totalMissions} inimigos derrotados</small></div><a href={`/trilhas/${activeCampaign.pathSlug}`}>CONTINUAR →</a></section> : null}
      <section className="dashboard-review-strip"><header><div><span className="kicker">REVISÕES RECOMENDADAS</span><h2>{reviews.length ? `${reviews.length} conteúdo(s) precisam de atenção` : "Nenhuma revisão necessária agora"}</h2></div>{reviews.length ? <a href="/biblioteca">REVISAR AGORA →</a> : null}</header>{reviews.length ? <div>{reviews.map((item) => <a href={`/biblioteca/${item.slug}`} key={item.slug}><strong>{item.title}</strong><span>{priorityLabel(item.priority)} · {item.reviewLabel.toLowerCase()}</span></a>)}</div> : <p>Continue sua jornada. A revisão inteligente aparece quando houver sinais reais de dificuldade ou esquecimento.</p>}</section>
      <div className="campaign-heading"><div><span className="kicker">CAMPANHAS INDEPENDENTES</span><h2>Explore qualquer tecnologia</h2></div><p>Troque de mundo quando quiser. O progresso de cada campanha permanece separado.</p></div>
      <div className="campaign-grid">{campaigns.map((campaign) => <a className={`campaign-card theme-${campaign.theme}`} href={`/trilhas/${campaign.pathSlug}`} key={campaign.slug}><span>{campaign.technologyName}</span><h3>{campaign.title}</h3><p>{campaign.subtitle}</p><small>Zona atual · {campaign.zoneTitle}</small><div className="progress-track"><i style={{ width: `${campaign.progress}%` }} /></div><footer><strong>{campaign.progress}%</strong><em>{campaign.progress ? "CONTINUAR →" : "COMEÇAR →"}</em></footer></a>)}</div>
      <div className="mission-list-heading"><div><span className="kicker">PROJECTS</span><h2>Construa algo real</h2></div><span>{projects.length} projetos</span></div>
      {projects.some((project) => project.newlyUnlocked) ? <div className="project-unlock-notice" role="status">✦ NOVO PROJETO LIBERADO — você atingiu os requisitos de uma nova entrega.</div> : null}
      <div className="project-card-grid">{projects.map((project) => <a className={`project-card state-${project.state}`} href={`/projetos/${project.slug}`} key={project.slug}><span>{project.newlyUnlocked ? "✦ NOVO PROJETO LIBERADO" : project.state === "completed" ? "🏆 CONCLUÍDO" : project.state === "locked" ? "⌁ EM PREPARAÇÃO" : "PROJECT MODE"}</span><h3>{project.title}</h3><p>{project.description}</p><div><small>{project.state === "locked" ? `Nível ${project.minLevel} · ${project.requiredMaterials} materiais · ${project.requiredBattles} batalhas` : `${project.completedSteps}/${project.totalSteps} etapas · ${project.deadlineDays} dias`}</small><strong>{project.xpReward} XP</strong></div></a>)}</div>
    </section>
  </main>;
}

function priorityLabel(value: "low" | "medium" | "high") {
  return ({ high: "alta prioridade", medium: "prioridade média", low: "preventiva" } as const)[value];
}
