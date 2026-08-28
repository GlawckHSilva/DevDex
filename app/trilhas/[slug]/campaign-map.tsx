"use client";

import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import Image from "next/image";
import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype, CampaignLore, CampaignNode, CampaignZone } from "@/db";
import { ENEMY_ASSETS } from "@/lib/enemy-assets";
import { CampaignTransmission } from "./campaign-transmission";

type NodeState = "completed" | "available" | "in_progress" | "locked";
type MapType = "enemy" | "bug" | "elite" | "boss";
type LayoutNode = { x: number; y: number; mobileX: number; mobileY: number; path: string; mobilePath: string };
type SelectedNode = CampaignNode & LayoutNode & { type: MapType; title: string; icon: string; state: NodeState; order: number; description: string; href: string | null };

const START = { x: 7, y: 74, mobileX: 50, mobileY: 72 };
const MAP_LAYOUT: LayoutNode[] = [
  { x: 12, y: 63, mobileX: 38, mobileY: 190, path: "M70 480 C95 468 92 422 120 410", mobilePath: "M180 72 C145 104 126 138 137 190" },
  { x: 24, y: 35, mobileX: 64, mobileY: 340, path: "M120 410 C165 365 185 250 240 228", mobilePath: "M137 190 C148 250 222 275 230 340" },
  { x: 35, y: 68, mobileX: 37, mobileY: 490, path: "M240 228 C305 250 295 405 350 442", mobilePath: "M230 340 C225 405 145 420 133 490" },
  { x: 46, y: 40, mobileX: 63, mobileY: 640, path: "M350 442 C405 420 402 285 460 260", mobilePath: "M133 490 C141 554 219 571 227 640" },
  { x: 57, y: 70, mobileX: 38, mobileY: 790, path: "M460 260 C520 285 515 420 570 455", mobilePath: "M227 640 C218 704 146 720 137 790" },
  { x: 67, y: 43, mobileX: 62, mobileY: 940, path: "M570 455 C625 430 620 310 670 280", mobilePath: "M137 790 C145 850 216 875 223 940" },
  { x: 76, y: 24, mobileX: 38, mobileY: 1090, path: "M670 280 C705 240 725 180 760 156", mobilePath: "M223 940 C214 1000 148 1020 137 1090" },
  { x: 82, y: 58, mobileX: 62, mobileY: 1240, path: "M760 156 C820 185 790 330 820 377", mobilePath: "M137 1090 C145 1150 216 1175 223 1240" },
];
const BOSS_LAYOUT: LayoutNode = { x: 88, y: 30, mobileX: 50, mobileY: 1390, path: "M820 377 C875 350 850 235 880 195", mobilePath: "M223 1240 C215 1310 180 1335 180 1390" };
const CAMPAIGN_ICONS: Record<string, string[]> = {
  "html-fundamentals": ["<>", "↗", "≡", "▣", "</>", "◫", "✦", "♛"],
  "css-fundamentals": ["#", "↔", "▢", "☷", "◈", "◎", "✦", "♛"],
  "javascript-fundamentals": ["◇", "[]", "+", "!", "{}", "ƒ", "✦", "♛"],
  "sql-fundamentals-sqlite": ["▦", "?", "↑", "↔", "%", "∈", "✦", "♛"],
};

export function CampaignAdventureMap({ zones, archetype, bosses, campaignPath, lore, loreSeen: initialLoreSeen }: {
  zones: CampaignZone[];
  archetype: Archetype;
  bosses: Record<number, { title: string; state: NodeState; href: string }>;
  campaignPath: string;
  lore: CampaignLore;
  loreSeen: boolean;
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
  const [loreSeen, setLoreSeen] = useState(initialLoreSeen);
  const [transmissionOpen, setTransmissionOpen] = useState(!initialLoreSeen);
  const [firstView, setFirstView] = useState(!initialLoreSeen);
  const selected = allNodes.find((node) => node.missionSlug === selectedSlug) ?? initial;
  const completed = nodes.filter((node) => node.state === "completed").length;
  const target = completed === 0 ? START : completed < nodes.length ? MAP_LAYOUT[completed] : bossNode ? BOSS_LAYOUT : MAP_LAYOUT[nodes.length - 1];
  const previous = completed <= 1 ? (completed === 0 ? START : MAP_LAYOUT[0]) : MAP_LAYOUT[completed - 1];
  const playerPosition = target === START ? { ...START, y: START.y - 9, mobileY: START.mobileY - 26 } : betweenWaypoints(previous, target);
  const previousPosition = previous === START ? { ...START, y: START.y - 9, mobileY: START.mobileY - 26 } : previous;

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

  function closeTransmission() {
    setTransmissionOpen(false);
    if (!loreSeen) {
      setLoreSeen(true);
      void fetch(`/api/campaigns/${campaignPath}/lore`, { method: "POST" }).catch(() => setLoreSeen(false));
    }
  }

  function reopenTransmission() { setFirstView(false); setTransmissionOpen(true); }

  return <section className="adventure-map-section" id="mapa" data-testid="campaign-map">
    {transmissionOpen ? <CampaignTransmission firstView={firstView} lore={lore} onClose={closeTransmission} open /> : null}
    <nav className="course-zone-nav" aria-label="Zonas do curso">{zones.map((item, index) => {
      const locked = item.nodes.every((node) => node.missionState === "locked");
      return <button className={`${index === selectedZoneIndex ? "active" : ""}${locked ? " locked" : ""}`} aria-current={index === selectedZoneIndex ? "step" : undefined} data-testid={`course-zone-${item.sortOrder}`} key={item.id} onClick={() => { setSelectedZoneIndex(index); setSelectedSlug(""); }}><i aria-hidden="true" /><span aria-hidden="true"><em>{locked ? "⌑" : "✦"}</em></span><small>{String(item.sortOrder).padStart(2, "0")}</small><strong>{item.title}</strong><b>{item.progress}%</b></button>;
    })}</nav>
    <div className="adventure-map-layout">
      <header className="adventure-zone-heading"><div><span>ZONA ATUAL</span><h2>Zona {String(zone.sortOrder).padStart(2, "0")} — {zone.title}</h2><p>{zone.storyIntro}</p></div><strong>{zone.nodes.filter((node) => node.missionState === "completed").length}/{zone.nodes.length} missões</strong></header>
      <div className="adventure-map-canvas" style={{ "--mobile-height": `${180 + allNodes.length * 150}px`, "--fog-reveal": `${Math.min(90, 19 + completed * 11)}%` } as CSSProperties}>
      <div className="map-atmosphere" aria-hidden="true" />
      <MapPath nodes={allNodes} />
      <FogLayer />
      <button aria-label="Abrir transmissão da campanha" className="adventure-start" data-testid="campaign-prologue" onClick={reopenTransmission} style={{ left: `${START.x}%`, top: `${START.y}%`, "--mobile-x": `${START.mobileX}%`, "--mobile-y": `${START.mobileY}px` } as CSSProperties} type="button"><span><Image alt="" aria-hidden="true" height={48} src="/ui/prologue-terminal-v1.png" width={48} /></span><strong>PRÓLOGO</strong><small>Transmissão</small></button>
      <PlayerMarker archetype={archetype} position={playerPosition} previous={previousPosition} arriving={arriving} />
      {allNodes.map((node, index) => <MapNode node={node} selected={selected.missionSlug === node.missionSlug} current={node.missionSlug === initial.missionSlug} onSelect={() => setSelectedSlug(node.missionSlug)} onKeyDown={(event) => selectByKeyboard(event, index)} key={node.missionSlug} />)}
      {arriving ? <div className="map-unlock-toast" role="status" data-testid="map-unlock-toast"><span>✦</span> NOVA BATALHA DESBLOQUEADA</div> : null}
      <div className="adventure-legend"><strong>CAMINHO</strong><span><i className="completed" />Concluído</span><span><i className="available" />Disponível</span><span><i className="locked" />Bloqueado</span></div>
      </div>
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
  return <div className={`map-player-position${arriving ? " arriving" : ""}`} data-testid="map-player" style={{ left: `${position.x}%`, top: `${position.y}%`, "--mobile-x": `${position.mobileX}%`, "--mobile-y": `${position.mobileY}px`, "--from-x": `${previous.x}%`, "--from-y": `${previous.y}%`, "--to-x": `${position.x}%`, "--to-y": `${position.y}%`, "--mobile-from-x": `${previous.mobileX}%`, "--mobile-from-y": `${previous.mobileY}px`, "--mobile-to-x": `${position.mobileX}%`, "--mobile-to-y": `${position.mobileY}px` } as CSSProperties}><div className="player-traveler"><PixelHero archetype={archetype} /></div><span>VOCÊ</span></div>;
}

function betweenWaypoints(from: typeof START, to: typeof START) {
  return { x: Math.round((from.x + to.x) / 2), y: Math.round((from.y + to.y) / 2), mobileX: Math.round((from.mobileX + to.mobileX) / 2), mobileY: Math.round((from.mobileY + to.mobileY) / 2) };
}

function MapNode({ node, selected, current, onSelect, onKeyDown }: { node: SelectedNode; selected: boolean; current: boolean; onSelect: () => void; onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void }) {
  const enemyAsset = ENEMY_ASSETS[node.enemyName];
  return <button
    aria-label={`${node.order}. ${node.enemyName}, ${node.title}, ${statusLabel(node.state)}`}
    aria-pressed={selected}
    className={`adventure-map-node type-${node.type} state-${node.state}${selected ? " selected" : ""}${current ? " current" : ""}`}
    data-testid={`map-node-${node.missionSlug}`}
    onClick={onSelect}
    onKeyDown={onKeyDown}
    style={{ left: `${node.x}%`, top: `${node.y}%`, "--mobile-x": `${node.mobileX}%`, "--mobile-y": `${node.mobileY}px` } as CSSProperties}
    type="button"
  ><span className={`map-node-encounter${enemyAsset ? " has-sprite" : ""}`}><i className="map-enemy-silhouette">{enemyAsset ? <Image alt="" aria-hidden="true" fill sizes="130px" src={enemyAsset} /> : node.icon}</i><i className="map-node-pedestal" />{node.state === "completed" ? <b aria-hidden="true">✓</b> : node.state === "locked" ? <b aria-hidden="true">⌁</b> : null}</span><strong>{node.enemyName}</strong><small>{node.title}</small><em>{node.type === "boss" ? "CHEFE" : node.type === "bug" ? "DESAFIO" : node.type === "elite" ? "ELITE" : `NÍVEL ${node.enemyLevel}`}</em></button>;
}

function MissionPanel({ node, campaignPath }: { node: SelectedNode; campaignPath: string }) {
  const projectBoss = node.missionSlug === "boss-project";
  const enemyAsset = ENEMY_ASSETS[node.enemyName];
  return <aside className="mission-detail-panel" aria-live="polite" data-testid="mission-panel">
    <span>ENCONTRO SELECIONADO</span>{enemyAsset ? <div className={`detail-enemy-sprite type-${node.type}`}><Image alt={`Sprite de ${node.enemyName}`} fill sizes="150px" src={enemyAsset} /></div> : <div className={`detail-node-icon type-${node.type}`}>{node.icon}</div>}<small>{node.type === "boss" ? "CHEFE DA ZONA" : node.type === "bug" ? "DESAFIO DE DEBUG" : node.type === "elite" ? "INIMIGO ELITE" : "INIMIGO COMUM"}</small><h3>{node.enemyName}</h3><strong>{node.title}</strong><p>{node.description}</p>{projectBoss ? null : <div className="mission-learning-flow"><span>1 · AULA</span><i>→</i><span>2 · PRÁTICA</span></div>}
    <dl><div><dt>STATUS</dt><dd className={`status-${node.state}`}>{statusLabel(node.state)}</dd></div><div><dt>RECOMPENSA</dt><dd>{node.xpReward} XP</dd></div></dl>
    {node.href ? <a className="button" href={node.href}>{node.state === "completed" ? "REVISAR" : projectBoss ? "⚔ ENTRAR NO PROJETO" : node.state === "in_progress" ? "⚔ CONTINUAR BATALHA" : "⚔ COMEÇAR AULA"}</a> : <button className="button" disabled>CAMINHO BLOQUEADO</button>}<a className="course-back-link" href={`#${campaignPath}`}>Curso completo · 48 aulas + 48 práticas</a>
  </aside>;
}

function statusLabel(state: NodeState) {
  if (state === "completed") return "Concluída";
  if (state === "in_progress") return "Em andamento";
  if (state === "available") return "Disponível";
  return "Bloqueada";
}
