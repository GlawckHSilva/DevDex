import { redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getJourney } from "@/db";

export const dynamic = "force-dynamic";

const nodeLabels = { enemy: "ENCONTRO", elite: "ELITE", boss: "CHEFE", checkpoint: "CHECKPOINT" } as const;

export default async function JourneyPage() {
  const user = await requireChatGPTUser("/jornada");
  await ensureUser(user);
  const journey = await getJourney(user);
  if (!journey.avatarId) redirect("/avatar?next=/jornada");
  return <main className="journey-page">
    <header className="journey-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><nav><a href="/dashboard">Painel</a><a className="journey-nav-active" href="/jornada">Jornada</a><a href="/projetos/lista-de-tarefas">Project Mode</a></nav><span className={`journey-avatar ${journey.avatarId}`}>{journey.avatarId === "kai" ? "K" : "N"}</span></header>
    <section className="world-hero"><span className="kicker">MAPA DE APRENDIZADO</span><h1>Seu código muda o mundo.</h1><p>Uma zona é um conjunto de skills. Cada encontro é uma prática real; o chefe reúne o que você acabou de aprender.</p><div className="world-locations"><span className="available">JavaScript City</span><span>CSS Forest</span><span>HTML Valley</span><span>SQL Mines</span></div></section>
    {journey.zones.map((zone) => <section className="zone-map" key={zone.slug}>
      <div className="zone-heading"><div><span className="kicker">ZONA 01 · {zone.theme.replaceAll("-", " ")}</span><h2>{zone.name}</h2><p>{zone.description}</p></div><span className="zone-status">{zone.nodes.filter((node) => node.state === "completed").length}/{zone.nodes.length} superados</span></div>
      <div className="map-path" aria-label={`Mapa da zona ${zone.name}`}>{zone.nodes.map((node, index) => <div className={`map-node ${node.kind} state-${node.state}`} key={node.slug}>
        {index > 0 ? <i className="map-link" aria-hidden="true" /> : null}
        {node.state === "locked" || !node.missionSlug ? <div className="node-card" aria-label={`${node.title}, bloqueado`}><span className="node-icon">{node.kind === "boss" ? "◆" : "◈"}</span><small>{nodeLabels[node.kind]}</small><strong>{node.title}</strong><em>Bloqueado</em></div>
          : <a className="node-card" href={`/missoes/${node.missionSlug}`}><span className="node-icon">{node.state === "completed" ? "✓" : node.kind === "boss" ? "◆" : "◈"}</span><small>{nodeLabels[node.kind]}</small><strong>{node.enemyName}</strong><em>{node.state === "completed" ? "Revisar" : "Batalhar"}</em></a>}
      </div>)}</div>
    </section>)}
    <section className="journey-mentor"><span className="mentor-pixel">DX</span><p><b>Dex:</b> HP não é sorte — cada parte da vida do inimigo corresponde a requisitos validados de verdade.</p></section>
  </main>;
}
