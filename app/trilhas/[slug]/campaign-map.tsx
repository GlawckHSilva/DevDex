"use client";

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype, CampaignNode, CampaignZone } from "@/db";

type NodeState = "completed" | "available" | "in_progress" | "locked";
type MapType = "enemy" | "bug" | "elite" | "boss";
type LayoutNode = { x: number; y: number; mobileX: number; mobileY: number; path: string; mobilePath: string };
type SelectedNode = CampaignNode & LayoutNode & { type: MapType; title: string; icon: string; state: NodeState; order: number; description: string; href: string | null };

const START = { x: 7, y: 74, mobileX: 50, mobileY: 72 };
const MAP_LAYOUT: LayoutNode[] = [
  { x: 17, y: 60, mobileX: 38, mobileY: 190, path: "M70 480 C112 474 112 405 170 390", mobilePath: "M180 72 C145 104 126 138 137 190" },
  { x: 30, y: 37, mobileX: 64, mobileY: 340, path: "M170 390 C205 330 244 252 300 240", mobilePath: "M137 190 C148 250 222 275 230 340" },
  { x: 41, y: 70, mobileX: 37, mobileY: 490, path: "M300 240 C358 256 350 430 410 455", mobilePath: "M230 340 C225 405 145 420 133 490" },
  { x: 52.5, y: 42, mobileX: 63, mobileY: 640, path: "M410 455 C468 439 467 300 525 275", mobilePath: "M133 490 C141 554 219 571 227 640" },
  { x: 62, y: 71, mobileX: 38, mobileY: 790, path: "M525 275 C590 294 568 438 620 460", mobilePath: "M227 640 C218 704 146 720 137 790" },
  { x: 70.5, y: 46, mobileX: 62, mobileY: 940, path: "M620 460 C666 438 655 330 705 300", mobilePath: "M137 790 C145 850 216 875 223 940" },
];
const BOSS_LAYOUT = MAP_LAYOUT[5];
const CAMPAIGN_ICONS: Record<string, string[]> = {
  "html-fundamentals": ["<>", "↗", "≡", "▣"],
  "css-fundamentals": ["#", "↔", "▢", "☷"],
  "javascript-fundamentals": ["◇", "[]", "+", "!", "✦"],
  "sql-fundamentals-sqlite": ["▦", "?", "↑", "↔", "%", "∈"],
};

export function CampaignAdventureMap({ zones, archetype, bosses, campaignPath }: {
  zones: CampaignZone[];
  archetype: Archetype;
  bosses: Record<number, { title: string; state: NodeState; href: string }>;
  campaignPath: string;
}) {
  const availableZoneIndex = zones.findIndex((item) => item.nodes.some((node) => node.missionState === "available" || node.missionState === "in_progress"));
  const currentZoneIndex = availableZoneIndex >= 0 ? availableZoneIndex : zones.length - 1;
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(currentZoneIndex);
  const zone = zones[selectedZoneIndex] ?? zones[currentZoneIndex];
  const boss = bosses[zone.id] ?? null;
  const nodes = useMemo<SelectedNode[]>(() => zone.nodes.map((node, index) => {
    const layout = MAP_LAYOUT[index] ?? MAP_LAYOUT.at(-1)!;
    const type = campaignPath === "javascript-fundamentals" && index === 3 ? "bug" : node.enemyType;
    return { ...node, ...layout, type, title: node.skillName, icon: CAMPAIGN_ICONS[campaignPath]?.[index] ?? (type === "elite" ? "✦" : "◇"), order: index + 1, state: node.missionState, description: node.enemyIntro || node.battleDialogue, href: node.missionState === "locked" ? null : `/missoes/${node.missionSlug}` };
  }), [campaignPath, zone.nodes]);
  const bossNode: SelectedNode | null = boss ? { ...BOSS_LAYOUT, type: "boss", title: "Project Mode", icon: "♛", order: nodes.length + 1, state: boss.state, description: "Construa uma aplicação real para restaurar o sistema central da zona.", href: boss.state === "locked" ? null : boss.href, missionSlug: "boss-project", missionTitle: boss.title, skillName: "Project Mode", xpReward: 720, enemyName: boss.title, enemyType: "boss", enemyLevel: nodes.length + 1, enemyIntro: "", battleDialogue: "", sortOrder: nodes.length + 1, zoneId: zone.id, missionState: boss.state } : null;
  const allNodes = bossNode ? [...nodes, bossNode] : nodes;
  const initial = allNodes.find((node) => node.state === "available" || node.state === "in_progress") ?? allNodes.at(-1)!;
  const [selectedSlug, setSelectedSlug] = useState(initial.missionSlug);
  const [arriving, setArriving] = useState(false);
  const selected = allNodes.find((node) => node.missionSlug === selectedSlug) ?? initial;
  const completed = nodes.filter((node) => node.state === "completed").length;
  const target = completed === 0 ? START : completed < nodes.length ? MAP_LAYOUT[completed] : bossNode ? BOSS_LAYOUT : MAP_LAYOUT[nodes.length - 1];
  const previous = completed <= 1 ? (completed === 0 ? START : MAP_LAYOUT[0]) : MAP_LAYOUT[completed - 1];
  const playerPosition = target === START ? { ...START, y: START.y - 9, mobileY: START.mobileY - 26 } : { ...target, x: target.x - 6, y: target.y + 8, mobileX: target.mobileX > 50 ? target.mobileX - 24 : target.mobileX + 24, mobileY: target.mobileY };
  const previousPosition = previous === START ? START : { ...previous, x: previous.x - 6, y: previous.y + 8, mobileX: previous.mobileX > 50 ? previous.mobileX - 24 : previous.mobileX + 24, mobileY: previous.mobileY };

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("victory")) return;
    const frame = window.requestAnimationFrame(() => setArriving(true));
    url.searchParams.delete("victory");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setArriving(false), 3000);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);

  function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(allNodes.length - 1, index + (["ArrowRight", "ArrowDown"].includes(event.key) ? 1 : -1)));
    setSelectedSlug(allNodes[next].missionSlug);
    document.querySelector<HTMLButtonElement>(`[data-testid="map-node-${allNodes[next].missionSlug}"]`)?.focus();
  }

  return <section className="adventure-map-section" id="mapa" data-testid="campaign-map">
    <header className="adventure-zone-heading"><div><span>ZONA ATUAL</span><h2>Zona {String(zone.sortOrder).padStart(2, "0")} — {zone.title}</h2><p>{zone.storyIntro}</p></div><strong>{zone.nodes.filter((node) => node.missionState === "completed").length}/{zone.nodes.length} missões</strong></header>
    <nav className="course-zone-nav" aria-label="Zonas do curso">{zones.map((item, index) => {
      const locked = item.nodes.every((node) => node.missionState === "locked");
      return <button className={`${index === selectedZoneIndex ? "active" : ""}${locked ? " locked" : ""}`} aria-current={index === selectedZoneIndex ? "step" : undefined} data-testid={`course-zone-${item.sortOrder}`} key={item.id} onClick={() => { setSelectedZoneIndex(index); setSelectedSlug(""); }}><span>{String(item.sortOrder).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.progress}%</small></button>;
    })}</nav>
    <div className="adventure-map-canvas" style={{ "--mobile-height": `${180 + allNodes.length * 150}px`, "--fog-reveal": `${Math.min(90, 19 + completed * 11)}%` } as CSSProperties}>
      <div className="map-atmosphere" aria-hidden="true" />
      <MapPath nodes={allNodes} />
      <FogLayer />
      <div className="adventure-start" style={{ left: `${START.x}%`, top: `${START.y}%`, "--mobile-x": `${START.mobileX}%`, "--mobile-y": `${START.mobileY}px` } as CSSProperties}><span>⚑</span><strong>INÍCIO</strong><small>Ponto de partida</small></div>
      <PlayerMarker archetype={archetype} position={playerPosition} previous={previousPosition} arriving={arriving} />
      {allNodes.map((node, index) => <MapNode node={node} selected={selected.missionSlug === node.missionSlug} current={node.missionSlug === initial.missionSlug} onSelect={() => setSelectedSlug(node.missionSlug)} onKeyDown={(event) => selectByKeyboard(event, index)} key={node.missionSlug} />)}
      {arriving ? <div className="map-unlock-toast" role="status" data-testid="map-unlock-toast"><span>✦</span> NOVA BATALHA DESBLOQUEADA</div> : null}
      <div className="adventure-legend"><strong>CAMINHO</strong><span><i className="completed" />Concluído</span><span><i className="available" />Disponível</span><span><i className="locked" />Bloqueado</span></div>
      <MissionPanel node={selected} campaignPath={campaignPath} />
    </div>
  </section>;
}

function MapPath({ nodes }: { nodes: SelectedNode[] }) {
  return <>
    <svg className="adventure-paths path-desktop" viewBox="0 0 1000 650" aria-hidden="true" preserveAspectRatio="none">{nodes.map((node) => <path className={`path-${node.state}`} d={node.path} key={node.missionSlug} />)}</svg>
    <svg className="adventure-paths path-mobile" viewBox="0 0 360 1060" aria-hidden="true" preserveAspectRatio="none">{nodes.map((node) => <path className={`path-${node.state}`} d={node.mobilePath} key={node.missionSlug} />)}</svg>
  </>;
}

function FogLayer() {
  return <div className="map-fog" aria-hidden="true"><i /><i /><i /></div>;
}

function PlayerMarker({ archetype, position, previous, arriving }: { archetype: Archetype; position: typeof START; previous: typeof START; arriving: boolean }) {
  return <div className={`map-player-position${arriving ? " arriving" : ""}`} data-testid="map-player" style={{ left: `${position.x}%`, top: `${position.y}%`, "--mobile-x": `${position.mobileX}%`, "--mobile-y": `${position.mobileY}px`, "--from-x": `${previous.x}%`, "--from-y": `${previous.y}%`, "--to-x": `${position.x}%`, "--to-y": `${position.y}%`, "--mobile-from-x": `${previous.mobileX}%`, "--mobile-from-y": `${previous.mobileY}px`, "--mobile-to-x": `${position.mobileX}%`, "--mobile-to-y": `${position.mobileY}px` } as CSSProperties}><div className="player-pedestal"><PixelHero archetype={archetype} /></div><span>VOCÊ</span></div>;
}

function MapNode({ node, selected, current, onSelect, onKeyDown }: { node: SelectedNode; selected: boolean; current: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  const hasSprite = node.enemyName === "Espectro do Esqueleto";
  return <button
    aria-label={`${node.order}. ${node.enemyName}, ${node.title}, ${statusLabel(node.state)}`}
    aria-pressed={selected}
    className={`adventure-map-node type-${node.type} state-${node.state}${selected ? " selected" : ""}${current ? " current" : ""}`}
    data-testid={`map-node-${node.missionSlug}`}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    style={{ left: `${node.x}%`, top: `${node.y}%`, "--mobile-x": `${node.mobileX}%`, "--mobile-y": `${node.mobileY}px` } as CSSProperties}
    type="button"
  ><span className={`map-node-encounter${hasSprite ? " has-sprite" : ""}`}><i className="map-enemy-silhouette">{hasSprite ? "" : node.icon}</i><i className="map-node-pedestal" />{node.state === "completed" ? <b aria-hidden="true">✓</b> : node.state === "locked" ? <b aria-hidden="true">⌁</b> : null}</span><strong>{node.enemyName}</strong><small>{node.title}</small><em>{node.type === "boss" ? "CHEFE" : node.type === "bug" ? "DESAFIO" : node.type === "elite" ? "ELITE" : `NÍVEL ${node.enemyLevel}`}</em></button>;
}

function MissionPanel({ node, campaignPath }: { node: SelectedNode; campaignPath: string }) {
  const projectBoss = node.missionSlug === "boss-project";
  return <aside className="mission-detail-panel" aria-live="polite" data-testid="mission-panel">
    <span>ENCONTRO SELECIONADO</span><div className={`detail-node-icon type-${node.type}`}>{node.icon}</div><small>{node.type === "boss" ? "CHEFE DA ZONA" : node.type === "bug" ? "DESAFIO DE DEBUG" : node.type === "elite" ? "INIMIGO ELITE" : "INIMIGO COMUM"}</small><h3>{node.enemyName}</h3><strong>{node.title}</strong><p>{node.description}</p>{projectBoss ? null : <div className="mission-learning-flow"><span>1 · AULA</span><i>→</i><span>2 · PRÁTICA</span></div>}
    <dl><div><dt>STATUS</dt><dd className={`status-${node.state}`}>{statusLabel(node.state)}</dd></div><div><dt>RECOMPENSA</dt><dd>{node.xpReward} XP</dd></div></dl>
    {node.href ? <a className="button" href={node.href}>{node.state === "completed" ? "REVISAR" : projectBoss ? "⚔ ENTRAR NO PROJETO" : node.state === "in_progress" ? "⚔ CONTINUAR BATALHA" : "⚔ COMEÇAR AULA"}</a> : <button className="button" disabled>CAMINHO BLOQUEADO</button>}<a className="course-back-link" href={`#${campaignPath}`}>Curso completo · 30 aulas + 30 práticas</a>
  </aside>;
}

function statusLabel(state: NodeState) {
  if (state === "completed") return "Concluída";
  if (state === "in_progress") return "Em andamento";
  if (state === "available") return "Disponível";
  return "Bloqueada";
}
