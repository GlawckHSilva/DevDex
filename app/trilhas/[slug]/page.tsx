import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getCampaign, getCharacter } from "@/db";
import { CharacterSelect, PixelHero } from "@/app/aventura/character-select";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/trilhas/${slug}`);
  const [campaign, character] = await Promise.all([getCampaign(user.userId, slug), getCharacter(user.userId)]);
  if (!campaign) notFound();

  return <main className={`campaign-page theme-${campaign.theme}`}>
    <header className="campaign-topbar"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><a className="back" href="/dashboard">← Campanhas</a></header>
    <section className="campaign-hero container">
      <div><span className="kicker">CAMPANHA · {campaign.technologyName}</span><h1>{campaign.title}</h1><p>{campaign.storyIntro}</p><div className="campaign-progress"><span>Progresso técnico</span><strong>{campaign.progress}%</strong><div className="progress-track"><i style={{ width: `${campaign.progress}%` }} /></div></div></div>
      {character ? <div className="campaign-character"><PixelHero archetype={character.archetype} /><small>AVENTUREIRO DEVDEX</small></div> : null}
    </section>
    {!character ? <section className="campaign-character-select container"><span className="kicker">ANTES DE ENTRAR</span><h2>Escolha seu aventureiro</h2><p>O mesmo personagem acompanhará você em todas as campanhas.</p><CharacterSelect /></section> : <section className="campaign-zones container" aria-label={`Mapa de ${campaign.title}`}>
      <div className="campaign-heading"><div><span className="kicker">MAPA DA CAMPANHA</span><h2>Zonas</h2></div><p>Os pré-requisitos existem apenas dentro desta campanha.</p></div>
      {campaign.zones.map((zone, zoneIndex) => <article className="campaign-zone" key={zone.slug}>
        <header><span>ZONA {String(zoneIndex + 1).padStart(2, "0")}</span><div><h3>{zone.title}</h3><p>{zone.storyIntro}</p></div><strong>{zone.progress}%</strong></header>
        <div className="campaign-nodes">{zone.nodes.map((node, index) => {
          const locked = node.missionState === "locked";
          const content = <><span className={`campaign-enemy enemy-${node.enemyType}`}>{node.enemyType === "boss" ? "♛" : node.enemyType === "elite" ? "✦" : "◆"}</span><small>{node.enemyType === "boss" ? "BOSS" : node.enemyType === "elite" ? "ELITE" : `INIMIGO ${index + 1}`}</small><h4>{node.enemyName}</h4><p>{node.skillName}</p><em>{node.missionState === "completed" ? "Vencido" : locked ? "Bloqueado" : "Enfrentar →"}</em></>;
          return locked ? <div className="campaign-node locked" key={node.missionSlug}>{content}</div> : <a className={`campaign-node state-${node.missionState}`} href={`/missoes/${node.missionSlug}`} key={node.missionSlug}>{content}</a>;
        })}</div>
        {zone.bossProjectSlug ? <a className="zone-project-boss" href={`/projetos/${zone.bossProjectSlug}?campaign=${campaign.pathSlug}`}><span>♛ BOSS DE CONSTRUÇÃO</span><div><strong>{zone.bossProjectTitle}</strong><small>Boss Battle · motor seguro de projetos</small></div><em>ENTRAR →</em></a> : null}
      </article>)}
      {campaign.recommendations.length ? <aside className="campaign-recommendations"><strong>Conhecimentos recomendados</strong><p>{campaign.recommendations.join(" · ")}</p><small>São recomendações. Você pode começar mesmo assim.</small></aside> : null}
    </section>}
  </main>;
}
