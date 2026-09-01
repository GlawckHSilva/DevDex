"use client";
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- canvas de mapa operável por ponteiro e teclado */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype, CampaignLore, CampaignNode, CampaignZone } from "@/db";
import { ENEMY_ASSETS } from "@/lib/enemy-assets";
import { motion, MotionConfig } from "motion/react";
import { CampaignTransmission } from "./campaign-transmission";

type NodeState = "completed" | "available" | "in_progress" | "locked";
type MapType = "study" | "enemy" | "bug" | "elite" | "boss";
type LayoutNode = { x: number; y: number; path: string };
type SelectedNode = CampaignNode & LayoutNode & { type: MapType; title: string; icon: string; state: NodeState; order: number; description: string; href: string | null };

const START = { x: 4, y: 52 };
const BOSS_LAYOUT: LayoutNode = { x: 96, y: 52, path: "M910 338 C930 338 940 338 960 338" };
const CAMPAIGN_ICONS: Record<string, string[]> = {
  "html-fundamentals": ["<>", "↗", "≡", "▣", "</>", "◫", "✦", "♛"],
  "css-fundamentals": ["#", "↔", "▢", "☷", "◈", "◎", "✦", "♛"],
  "javascript-fundamentals": ["◇", "[]", "+", "!", "{}", "ƒ", "✦", "♛"],
  "sql-fundamentals-sqlite": ["▦", "?", "↑", "↔", "%", "∈", "✦", "♛"],
  "python-fundamentals": [">_", "[]", "ƒ", "!", "{}", "⚙", "✦", "♛"],
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
  const zoneLayouts = useMemo(() => layoutsFor(zone.nodes.length), [zone.nodes.length]);
  const nodes = useMemo<SelectedNode[]>(() => zone.nodes.map((node, index) => {
    const layout = zoneLayouts[index];
    const type = node.nodeKind === "study" ? "study" : campaignPath === "javascript-fundamentals" && index === 3 ? "bug" : node.enemyType;
    return { ...node, ...layout, type, title: node.skillName, icon: type === "study" ? "▤" : CAMPAIGN_ICONS[campaignPath]?.[index % 8] ?? (type === "elite" ? "✦" : "◇"), order: index + 1, state: node.missionState, description: node.enemyIntro || node.battleDialogue, href: node.missionState === "locked" ? null : node.nodeKind === "study" ? `/aulas/${node.missionSlug}` : `/missoes/${node.missionSlug}` };
  }), [campaignPath, zone.nodes, zoneLayouts]);
  const bossNode: SelectedNode | null = boss ? { ...BOSS_LAYOUT, nodeKind: "battle", type: "boss", title: "Project Mode", icon: "♛", order: nodes.length + 1, state: boss.state, description: "Construa uma aplicação real para restaurar o sistema central da zona.", href: boss.state === "locked" ? null : boss.href, missionSlug: "boss-project", missionTitle: boss.title, skillName: "Project Mode", xpReward: 720, enemyName: boss.title, enemyType: "boss", enemyLevel: nodes.length + 1, enemyIntro: "", battleDialogue: "", sortOrder: nodes.length + 1, zoneId: zone.id, missionState: boss.state } : null;
  const allNodes = bossNode ? [...nodes, bossNode] : nodes;
  const worldWidth = Math.max(1600, (allNodes.length + 2) * 190);
  const initial = allNodes.find((node) => node.state === "available" || node.state === "in_progress") ?? allNodes.at(-1)!;
  const [selectedSlug, setSelectedSlug] = useState(initial.missionSlug);
  const [arriving, setArriving] = useState(false);
  const [loreSeen, setLoreSeen] = useState(initialLoreSeen);
  const [transmissionOpen, setTransmissionOpen] = useState(!initialLoreSeen);
  const [firstView, setFirstView] = useState(!initialLoreSeen);
  const [panning, setPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ pointerId: number; x: number; offsetX: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const selected = allNodes.find((node) => node.missionSlug === selectedSlug) ?? initial;
  const completed = nodes.filter((node) => node.state === "completed").length;
  const target = completed === 0 ? START : completed < nodes.length ? zoneLayouts[completed] : bossNode ? BOSS_LAYOUT : zoneLayouts[nodes.length - 1];
  const previous = completed <= 1 ? (completed === 0 ? START : zoneLayouts[0]) : zoneLayouts[completed - 1];
  const playerPosition = target === START ? { ...START, y: START.y - 9 } : betweenWaypoints(previous, target);
  const previousPosition = previous === START ? { ...START, y: START.y - 9 } : previous;

  const moveWorld = useCallback((x: number, animated = false) => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    if (!viewport || !world) return;
    const next = {
      x: Math.max(Math.min(0, viewport.clientWidth - world.offsetWidth), Math.min(0, x)),
      y: 0,
    };
    offsetRef.current = next;
    world.classList.toggle("centering", animated);
    world.style.transform = `translate3d(${next.x}px,${next.y}px,0)`;
    if (animated) window.setTimeout(() => world.classList.remove("centering"), 420);
  }, []);

  const centerOnPlayer = useCallback((animated = true) => {
    const viewport = viewportRef.current;
    const world = worldRef.current;
    const player = world?.querySelector<HTMLElement>("[data-testid='map-player']");
    if (!viewport || !world || !player) return;
    moveWorld(viewport.clientWidth / 2 - player.offsetLeft, animated);
  }, [moveWorld]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("victory")) return;
    const frame = window.requestAnimationFrame(() => setArriving(true));
    url.searchParams.delete("victory");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setArriving(false), 3000);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => centerOnPlayer(false));
    const resize = () => moveWorld(offsetRef.current.x);
    window.addEventListener("resize", resize);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [centerOnPlayer, moveWorld, zone.id]);

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as HTMLElement).closest(".map-pan-controls")) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, offsetX: offsetRef.current.x, moved: false };
  }

  function pan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const x = event.clientX - drag.x;
    if (!drag.moved && Math.abs(x) < 5) return;
    drag.moved = true;
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
    setPanning(true);
    moveWorld(drag.offsetX + x);
  }

  function endPan(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { suppressClickRef.current = false; }, 0);
  }

  function panByKeyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    const directions: Record<string, number> = { ArrowLeft: 70, a: 70, ArrowRight: -70, d: -70 };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    moveWorld(offsetRef.current.x + direction, true);
  }

  function selectByKeyboard(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(allNodes.length - 1, index + (event.key === "ArrowRight" ? 1 : -1)));
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
    <MotionConfig reducedMotion="user"><nav className="course-zone-nav" aria-label="Zonas do curso">{zones.map((item, index) => {
      const locked = item.nodes.every((node) => node.missionState === "locked");
      return <motion.button className={`${index === selectedZoneIndex ? "active" : ""}${locked ? " locked" : ""}`} aria-current={index === selectedZoneIndex ? "step" : undefined} data-testid={`course-zone-${item.sortOrder}`} key={item.id} onClick={() => { setSelectedZoneIndex(index); setSelectedSlug(""); }} whileHover={locked ? undefined : { y: -2 }} whileTap={locked ? undefined : { scale: .97 }} transition={{ duration: .16 }}><i aria-hidden="true" /><span aria-hidden="true"><em>{locked ? "⌑" : "✦"}</em></span><small>{String(item.sortOrder).padStart(2, "0")}</small><strong>{item.title}</strong><b>{item.progress}%</b></motion.button>;
    })}</nav></MotionConfig>
    <div className="adventure-map-layout">
      <header className="adventure-zone-heading"><div><span>ZONA ATUAL</span><h2>Zona {String(zone.sortOrder).padStart(2, "0")} — {zone.title}</h2><p>{zone.storyIntro}</p></div><strong>{zone.nodes.filter((node) => node.missionState === "completed").length}/{zone.nodes.length} missões</strong></header>
      <div aria-label="Mapa horizontal explorável. Arraste para os lados ou use as setas esquerda e direita." className={`adventure-map-canvas map-pannable${allNodes.length > 9 ? " map-dense" : ""}${panning ? " is-panning" : ""}`} data-testid="map-viewport" onClickCapture={(event) => { if (suppressClickRef.current) { event.preventDefault(); event.stopPropagation(); } }} onKeyDown={panByKeyboard} onPointerCancel={endPan} onPointerDown={startPan} onPointerMove={pan} onPointerUp={endPan} ref={viewportRef} role="application" style={{ "--fog-reveal": `${Math.min(90, 19 + (completed / Math.max(1, nodes.length)) * 71)}%` } as CSSProperties} tabIndex={0}>
      <div className="adventure-map-world" data-testid="map-world" ref={worldRef} style={{ "--world-width": `${worldWidth}px` } as CSSProperties}>
        <div className="map-atmosphere" aria-hidden="true" />
        <MapPath nodes={allNodes} />
        <FogLayer />
        <button aria-label="Abrir transmissão da campanha" className="adventure-start" data-testid="campaign-prologue" onClick={reopenTransmission} style={{ left: `${START.x}%`, top: `${START.y}%`, "--map-x": `${START.x}%`, "--map-y": `${START.y}%` } as CSSProperties} type="button"><span><Image alt="" aria-hidden="true" height={48} src="/ui/prologue-terminal-v1.png" width={48} /></span><strong>PRÓLOGO</strong><small>Transmissão</small></button>
        <PlayerMarker archetype={archetype} position={playerPosition} previous={previousPosition} arriving={arriving} />
        {allNodes.map((node, index) => <MapNode node={node} selected={selected.missionSlug === node.missionSlug} current={node.missionSlug === initial.missionSlug} onSelect={() => setSelectedSlug(node.missionSlug)} onKeyDown={(event) => selectByKeyboard(event, index)} key={node.missionSlug} />)}
      </div>
      {arriving ? <div className="map-unlock-toast" role="status" data-testid="map-unlock-toast"><span>✦</span> NOVA ETAPA DESBLOQUEADA</div> : null}
      <div className="map-pan-controls"><span>ARRASTE PARA OS LADOS</span><button onClick={() => centerOnPlayer()} type="button">◎ Centralizar</button></div>
      <div className="adventure-legend"><strong>CAMINHO</strong><span><i className="completed" />Concluído</span><span><i className="available" />Disponível</span><span><i className="locked" />Bloqueado</span></div>
      </div>
      <MissionPanel node={selected} campaignPath={campaignPath} />
    </div>
  </section>;
}

function MapPath({ nodes }: { nodes: SelectedNode[] }) {
  return <svg className="adventure-paths path-desktop" viewBox="0 0 1000 650" aria-hidden="true" preserveAspectRatio="none">{nodes.map((node) => <path className={`path-${node.state}`} d={node.path} key={node.missionSlug} />)}</svg>;
}

function FogLayer() {
  return <div className="map-fog" aria-hidden="true"><i /><i /><i /></div>;
}

function PlayerMarker({ archetype, position, previous, arriving }: { archetype: Archetype; position: typeof START; previous: typeof START; arriving: boolean }) {
  return <div className={`map-player-position${arriving ? " arriving" : ""}`} data-testid="map-player" style={{ left: `${position.x}%`, top: `${position.y}%`, "--map-x": `${position.x}%`, "--map-y": `${position.y}%`, "--from-x": `${previous.x}%`, "--from-y": `${previous.y}%`, "--to-x": `${position.x}%`, "--to-y": `${position.y}%` } as CSSProperties}><div className="player-traveler"><PixelHero archetype={archetype} /></div><span>VOCÊ</span></div>;
}

function layoutsFor(total: number): LayoutNode[] {
  const points = Array.from({ length: total }, (_, index) => ({ x: 9 + 82 * index / Math.max(1, total - 1), y: 52 }));
  return points.map((point, index) => {
    const previous = index ? points[index - 1] : START;
    const midpoint = (previous.x + point.x) * 5;
    return { ...point, path: `M${previous.x * 10} ${previous.y * 6.5} C${midpoint} ${previous.y * 6.5} ${midpoint} ${point.y * 6.5} ${point.x * 10} ${point.y * 6.5}` };
  });
}

function betweenWaypoints(from: typeof START, to: typeof START) {
  return { x: Math.round((from.x + to.x) / 2), y: Math.round((from.y + to.y) / 2) };
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
    style={{ left: `${node.x}%`, top: `${node.y}%`, "--map-x": `${node.x}%`, "--map-y": `${node.y}%` } as CSSProperties}
    type="button"
  ><span className={`map-node-encounter${enemyAsset ? " has-sprite" : ""}`}><i className="map-enemy-silhouette">{enemyAsset ? <Image alt="" aria-hidden="true" fill sizes="130px" src={enemyAsset} /> : node.icon}</i><i className="map-node-pedestal" />{node.state === "completed" ? <b aria-hidden="true">✓</b> : node.state === "locked" ? <b aria-hidden="true">⌁</b> : null}</span><strong>{node.enemyName}</strong><small>{node.title}</small><em>{node.type === "boss" ? "CHEFE" : node.type === "bug" ? "DESAFIO" : node.type === "elite" ? "ELITE" : `NÍVEL ${node.enemyLevel}`}</em></button>;
}

function MissionPanel({ node, campaignPath }: { node: SelectedNode; campaignPath: string }) {
  const projectBoss = node.missionSlug === "boss-project";
  const study = node.nodeKind === "study";
  const enemyAsset = ENEMY_ASSETS[node.enemyName];
  return <aside className="mission-detail-panel" aria-live="polite" data-testid="mission-panel">
    <span>{study ? "ESTUDO SELECIONADO" : "ENCONTRO SELECIONADO"}</span>{enemyAsset ? <div className={`detail-enemy-sprite type-${node.type}`}><Image alt={`Sprite de ${node.enemyName}`} fill sizes="150px" src={enemyAsset} /></div> : <div className={`detail-node-icon type-${node.type}`}>{node.icon}</div>}<small>{study ? "MATERIAL DE ESTUDO" : node.type === "boss" ? "CHEFE DA ZONA" : node.type === "bug" ? "DESAFIO DE DEBUG" : node.type === "elite" ? "INIMIGO ELITE" : "INIMIGO COMUM"}</small><h3>{node.enemyName}</h3><strong>{node.title}</strong><p>{node.description}</p>{study ? <div className="mission-learning-flow"><span>PDF + VÍDEO</span><i>→</i><span>5 BATALHAS</span></div> : null}
    <dl><div><dt>STATUS</dt><dd className={`status-${node.state}`}>{statusLabel(node.state)}</dd></div><div><dt>{study ? "CONTEÚDO" : "RECOMPENSA"}</dt><dd>{study ? "GUIA DA ETAPA" : `${node.xpReward} XP`}</dd></div></dl>
    {node.href ? <a className="button" href={node.href}>{study ? node.state === "completed" ? "REVISAR MATERIAL" : "ABRIR MATERIAL" : node.state === "completed" ? "REPETIR BATALHA" : projectBoss ? "⚔ ENTRAR NO PROJETO" : node.state === "in_progress" ? "⚔ CONTINUAR BATALHA" : "⚔ COMEÇAR BATALHA"}</a> : <button className="button" disabled>CAMINHO BLOQUEADO</button>}<a className="course-back-link" href={`#${campaignPath}`}>Curso completo · 150 etapas</a>
  </aside>;
}

function statusLabel(state: NodeState) {
  if (state === "completed") return "Concluída";
  if (state === "in_progress") return "Em andamento";
  if (state === "available") return "Disponível";
  return "Bloqueada";
}
