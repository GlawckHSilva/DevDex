import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getCampaign, getCharacter, getDashboard, getProjectSummaries } from "@/db";
import { CharacterSelect, PixelHero } from "@/app/aventura/character-select";
import { CampaignAdventureMap } from "./campaign-map";

export const dynamic = "force-dynamic";

const CAMPAIGN_MARKS: Record<string, string> = {
  "html-fundamentals": "⌘",
  "css-fundamentals": "✦",
  "javascript-fundamentals": "◇",
  "sql-fundamentals-sqlite": "▦",
};

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/trilhas/${slug}`);
  const [campaign, character, { profile }, projects] = await Promise.all([getCampaign(user.userId, slug), getCharacter(user.userId), getDashboard(user), getProjectSummaries(user.userId)]);
  if (!campaign) notFound();
  const totalMissions = campaign.zones.reduce((total, zone) => total + zone.nodes.length, 0);
  const completedMissions = campaign.zones.reduce((total, zone) => total + zone.nodes.filter((node) => node.missionState === "completed").length, 0);
  const bosses = Object.fromEntries(campaign.zones.flatMap((zone) => {
    const project = projects.find((item) => item.slug === zone.bossProjectSlug);
    return project ? [[zone.id, { title: project.title, state: zone.nodes.every((node) => node.missionState === "completed") ? project.state : "locked" as const, href: `/projetos/${project.slug}?campaign=${campaign.pathSlug}` }]] : [];
  }));

  return <main className={`game-campaign-shell theme-${campaign.theme}`} id={campaign.pathSlug}>
    <section className="game-campaign-main"><nav className="game-campaign-topbar" aria-label="Navegação da campanha"><a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a><a href="/dashboard">← Voltar às campanhas</a></nav><header className="game-campaign-header"><div className="campaign-title-block"><div className="campaign-emblem" aria-hidden="true">{CAMPAIGN_MARKS[campaign.pathSlug] ?? "◇"}</div><div><span className="kicker">CURSO COMPLETO · {campaign.technologyName}</span><h1>{campaign.title}</h1><p>{campaign.storyIntro}</p><small className="course-format">48 aulas explicativas · 48 práticas · 6 zonas · básico ao profissional</small></div></div><div className="header-campaign-progress"><span>PROGRESSO DO CURSO <b>{campaign.progress}%</b></span><div className="progress-track"><i style={{ width: `${campaign.progress}%` }} /></div><small>{completedMissions} / {totalMissions} missões concluídas</small></div>{character ? <div className="game-player-card"><PixelHero archetype={character.archetype} small /><div><strong>{user.displayName.split("@")[0]}</strong><small>NÍVEL {profile.level}</small><b>{profile.totalXp} XP</b></div></div> : null}</header>
      {!character ? <section className="campaign-character-select"><span className="kicker">ANTES DE ENTRAR</span><h2>Escolha seu aventureiro</h2><p>O mesmo personagem acompanhará você em todas as campanhas.</p><CharacterSelect /></section> : campaign.zones.length ? <CampaignAdventureMap zones={campaign.zones} archetype={character.archetype} bosses={bosses} campaignPath={campaign.pathSlug} /> : null}
    </section>
  </main>;
}
