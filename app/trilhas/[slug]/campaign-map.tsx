"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype, CampaignNode, CampaignZone } from "@/db";

type NodeState = "completed" | "available" | "in_progress" | "locked";
type MapType = "enemy" | "bug" | "elite" | "boss";
type LayoutNode = { type: MapType; title: string; x: number; y: number; icon: string; path: string };
type SelectedNode = CampaignNode & LayoutNode & { state: NodeState; order: number; description: string; href: string | null };

const MAP_LAYOUT: LayoutNode[] = [
  { type: "enemy", title: "Variáveis", x: 22, y: 55, icon: "◇", path: "M90 410 C140 410 160 330 220 310" },
  { type: "enemy", title: "Tipos", x: 39, y: 38, icon: "[]", path: "M220 310 C285 250 330 230 390 215" },
  { type: "enemy", title: "Operadores", x: 49, y: 70, icon: "+", path: "M390 215 C430 250 435 380 490 390" },
  { type: "bug", title: "Bug Battle", x: 63, y: 42, icon: "!", path: "M490 390 C550 385 560 245 630 235" },
  { type: "elite", title: "Elite", x: 75, y: 68, icon: "✦", path: "M630 235 C680 255 690 365 750 380" },
];
const BOSS_LAYOUT: LayoutNode = { type: "boss", title: "Boss", x: 89, y: 45, icon: "♛", path: "M750 380 C815 380 825 280 890 255" };

export function CampaignAdventureMap({ zone, archetype, boss, campaignPath }: {
  zone: CampaignZone;
  archetype: Archetype;
  boss: { title: string; state: NodeState; href: string } | null;
  campaignPath: string;
}) {
  const nodes = useMemo<SelectedNode[]>(() => zone.nodes.map((node, index) => {
    const layout = MAP_LAYOUT[index] ?? MAP_LAYOUT.at(-1)!;
    return { ...node, ...layout, order: index + 1, state: node.missionState, description: node.enemyIntro || node.battleDialogue, href: node.missionState === "locked" ? null : `/missoes/${node.missionSlug}` };
  }), [zone.nodes]);
  const bossNode = boss ? { ...BOSS_LAYOUT, order: nodes.length + 1, state: boss.state, description: "Construa uma aplicação real para restaurar o sistema central da zona.", href: boss.state === "locked" ? null : boss.href, missionSlug: "boss-project", missionTitle: boss.title, skillName: "Project Mode", xpReward: 720, enemyName: boss.title, enemyType: "boss" as const, enemyLevel: nodes.length + 1, enemyIntro: "", battleDialogue: "", sortOrder: nodes.length + 1, zoneId: zone.id, missionState: boss.state } : null;
  const allNodes = bossNode ? [...nodes, bossNode] : nodes;
  const initial = allNodes.find((node) => node.state === "available" || node.state === "in_progress") ?? allNodes.at(-1)!;
  const [selectedSlug, setSelectedSlug] = useState(initial.missionSlug);
  const selected = allNodes.find((node) => node.missionSlug === selectedSlug) ?? initial;
  const completed = nodes.filter((node) => node.state === "completed").length;
  const playerPosition = completed === 0 ? { x: 8, y: 73 } : completed < nodes.length ? MAP_LAYOUT[completed] : BOSS_LAYOUT;

  return <section className="adventure-map-section" id="mapa" data-testid="campaign-map">
    <header className="adventure-zone-heading"><div><span>ZONA ATUAL</span><h2>Zona 01 — {zone.title}</h2><p>{zone.storyIntro}</p></div><a href={`#${campaignPath}`}>Ver zonas</a></header>
    <div className="adventure-map-layout">
      <div className="adventure-map-canvas">
        <svg className="adventure-paths" viewBox="0 0 1000 560" aria-hidden="true" preserveAspectRatio="none">{allNodes.map((node) => <path className={`path-${node.state}`} d={node.path} key={node.missionSlug} />)}</svg>
        <div className="adventure-start" style={{ left: "8%", top: "73%" }}><span>⚑</span><strong>INÍCIO</strong><small>Ponto de partida</small></div>
        <div className="map-player-position" data-testid="map-player" style={{ left: `${playerPosition.x}%`, top: `${playerPosition.y}%`, "--mobile-y": `${60 + completed * 140}px` } as CSSProperties}><PixelHero archetype={archetype} /><span>VOCÊ</span></div>
        {allNodes.map((node) => <button
          aria-label={`${node.order}. ${node.title}, ${statusLabel(node.state)}`}
          aria-pressed={selected.missionSlug === node.missionSlug}
          className={`adventure-map-node type-${node.type} state-${node.state}${selected.missionSlug === node.missionSlug ? " selected" : ""}`}
          data-testid={`map-node-${node.missionSlug}`}
          key={node.missionSlug}
          onClick={() => setSelectedSlug(node.missionSlug)}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          type="button"
        ><span className="adventure-node-icon">{node.icon}</span><strong>{node.order}. {node.title}</strong><small>{node.type === "boss" ? node.enemyName : node.type === "bug" ? "Debug Challenge" : node.type === "elite" ? "Elite" : "Inimigo"} {node.state === "locked" ? "▣" : node.state === "completed" ? "✓" : ""}</small></button>)}
        <div className="adventure-legend"><strong>LEGENDA</strong><span><i className="completed" />Concluído</span><span><i className="available" />Disponível</span><span><i className="locked" />Bloqueado</span></div>
      </div>
      <aside className="mission-detail-panel" aria-live="polite" data-testid="mission-panel">
        <span>MISSÃO SELECIONADA</span><div className={`detail-node-icon type-${selected.type}`}>{selected.icon}</div><h3>{selected.order}. {selected.title}</h3><strong>{selected.type === "boss" ? "BOSS" : selected.type === "bug" ? "DEBUG CHALLENGE" : selected.type === "elite" ? "ELITE" : "INIMIGO"}</strong><p>{selected.description}</p>
        <dl><div><dt>STATUS</dt><dd className={`status-${selected.state}`}>{statusLabel(selected.state)}</dd></div><div><dt>RECOMPENSA</dt><dd>{selected.xpReward} XP</dd></div></dl>
        {selected.href ? <a className="button" href={selected.href}>{selected.state === "completed" ? "REVISAR" : selected.state === "in_progress" ? "CONTINUAR" : "JOGAR"} →</a> : <button className="button" disabled>CONCLUA A MISSÃO ANTERIOR</button>}
      </aside>
    </div>
  </section>;
}

function statusLabel(state: NodeState) {
  if (state === "completed") return "Concluída";
  if (state === "in_progress") return "Em andamento";
  if (state === "available") return "Disponível";
  return "Bloqueada";
}
