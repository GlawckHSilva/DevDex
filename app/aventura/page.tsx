import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getAdventure, getDashboard } from "@/db";
import { CharacterSelect, PixelHero } from "./character-select";

export const metadata = { title: "Aventura" };
export const dynamic = "force-dynamic";

export default async function AdventurePage() {
  const user = await requireChatGPTUser("/aventura");
  const [{ character, nodes }, { profile }] = await Promise.all([getAdventure(user.userId), getDashboard(user)]);
  if (!character) return <main className="adventure-onboarding container">
    <header className="app-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><a className="back" href="/dashboard">← Dashboard</a></header>
    <span className="kicker">ANTES DA JORNADA</span><h1>Escolha seu personagem</h1><p>Sua escolha define sua aparência na aventura. Conhecimento e progresso continuam dependendo do seu código.</p><CharacterSelect />
  </main>;

  const completed = nodes.filter((node) => node.missionState === "completed").length;
  return <main className="zone-page">
    <header className="zone-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>ZONA 01</small><strong>Bosque dos Fundamentos</strong></div><div className="zone-player"><PixelHero archetype={character.archetype} small /><span>Nível {profile.level}<small>{profile.totalXp} XP</small></span></div></header>
    <section className="zone-map" aria-label="Mapa do Bosque dos Fundamentos">
      <div className="zone-intro"><span className="kicker">PRIMEIRA ZONA</span><h1>O código despertou criaturas antigas.</h1><p>Supere cinco batalhas JavaScript para libertar o bosque.</p><strong>{completed}/{nodes.length} inimigos vencidos</strong></div>
      <div className="map-path" />
      {nodes.map((node, index) => {
        const locked = node.missionState === "locked";
        const completedNode = node.missionState === "completed";
        const content = <><span className={`map-enemy enemy-${node.enemyType}`}><i>{node.enemyType === "boss" ? "♛" : node.enemyType === "elite" ? "✦" : "◆"}</i></span><small>{node.enemyType === "boss" ? "CHEFE" : node.enemyType === "elite" ? "ELITE" : `NÍVEL ${node.enemyLevel}`}</small><strong>{node.enemyName}</strong><em>{completedNode ? "Vencido" : locked ? "Bloqueado" : "Enfrentar"}</em></>;
        return locked ? <div className={`map-node node-${index + 1} locked`} key={node.missionId}>{content}</div> : <a className={`map-node node-${index + 1}${completedNode ? " completed" : ""}`} href={`/missoes/${node.missionSlug}`} key={node.missionId}>{content}</a>;
      })}
    </section>
  </main>;
}
