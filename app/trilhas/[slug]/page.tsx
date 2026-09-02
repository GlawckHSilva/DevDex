import { notFound } from "next/navigation";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { AppSidebar } from "@/app/dashboard/sidebar";
import { getCampaign, getCampaignSummaries, getCharacter, getDashboard, getProjectSummaries } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";
import { CharacterSelect, PixelHero } from "@/app/aventura/character-select";
import { CampaignAdventureMap } from "./campaign-map";

export const dynamic = "force-dynamic";

const CAMPAIGN_MARKS: Record<string, string> = {
  "html-fundamentals": "⌘",
  "css-fundamentals": "✦",
  "javascript-fundamentals": "◇",
  "sql-fundamentals-sqlite": "▦",
  "python-fundamentals": "Py",
  "github-fundamentals": "GH",
};

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/trilhas/${slug}`);
  const [campaign, campaigns, character, { profile }, projects] = await Promise.all([getCampaign(user.userId, slug), getCampaignSummaries(user.userId), getCharacter(user.userId), getDashboard(user), getProjectSummaries(user.userId)]);
  if (!campaign) notFound();
  const totalMissions = campaign.zones.reduce((total, zone) => total + zone.nodes.length, 0);
  const studyCount = campaign.zones.reduce((total, zone) => total + zone.nodes.filter((node) => node.nodeKind === "study").length, 0);
  const battleCount = totalMissions - studyCount;
  const completedMissions = campaign.zones.reduce((total, zone) => total + zone.nodes.filter((node) => node.missionState === "completed").length, 0);
  const bosses = Object.fromEntries(campaign.zones.flatMap((zone) => {
    const project = projects.find((item) => item.slug === zone.bossProjectSlug);
    return project ? [[zone.id, { title: project.title, state: zone.nodes.every((node) => node.missionState === "completed") ? project.state : "locked" as const, href: `/projetos/${project.slug}?campaign=${campaign.pathSlug}` }]] : [];
  }));

  return <main className={`game-campaign-shell has-app-sidebar theme-${campaign.theme}`} id={campaign.pathSlug}>
    <AppSidebar campaigns={campaigns} skillPoints={profile.skillPoints} admin={isAdminEmail(user.email)} signOutHref={chatGPTSignOutPath("/")} activePath={`/trilhas/${campaign.pathSlug}`} />
    <section className="game-campaign-main"><nav className="game-campaign-topbar" aria-label="Navegação da campanha"><span>{campaign.technologyName} · CAMPANHA</span><a href="/dashboard">← Voltar às campanhas</a></nav><header className="game-campaign-header"><div className="campaign-title-block"><div className="campaign-emblem" aria-hidden="true"><span>{CAMPAIGN_MARKS[campaign.pathSlug] ?? "◇"}</span></div><div className="campaign-title-content"><div className="campaign-dossier-kicker"><span>◇ ARQUIVO DE CAMPANHA</span><b>{campaign.technologyName}</b></div><h1>{campaign.title}</h1><div className="campaign-title-rule" aria-hidden="true"><i /></div><p>{campaign.lore.shortDescription}</p><div className="campaign-title-stats" aria-label={studyCount ? `${studyCount} materiais, ${battleCount} batalhas, ${totalMissions} etapas` : `${totalMissions} aulas, ${totalMissions} batalhas, do básico ao profissional`}>{studyCount ? <><span><b>{studyCount}</b> MATERIAIS</span><span><b>{battleCount}</b> BATALHAS</span><span><b>{totalMissions}</b> ETAPAS</span></> : <><span><b>{totalMissions}</b> AULAS</span><span><b>{totalMissions}</b> BATALHAS</span><span>BÁSICO → PROFISSIONAL</span></>}</div></div></div><div className="header-campaign-progress"><span>PROGRESSO DO CURSO <b>{campaign.progress}%</b></span><div className="progress-track"><i style={{ width: `${campaign.progress}%` }} /></div><small>{completedMissions} / {totalMissions} etapas concluídas</small></div>{character ? <div className="game-player-card"><PixelHero archetype={character.archetype} small /><div><strong>{user.displayName.split("@")[0]}</strong><small>NÍVEL {profile.level}</small><b>{profile.totalXp} XP</b></div></div> : null}</header>
      {!character ? <section className="campaign-character-select"><span className="kicker">ANTES DE ENTRAR</span><h2>Escolha seu aventureiro</h2><p>O mesmo personagem acompanhará você em todas as campanhas.</p><CharacterSelect /></section> : campaign.zones.length ? <CampaignAdventureMap zones={campaign.zones} archetype={character.archetype} bosses={bosses} campaignPath={campaign.pathSlug} lore={campaign.lore} loreSeen={campaign.loreSeen} /> : null}
    </section>
  </main>;
}
