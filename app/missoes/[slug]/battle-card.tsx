"use client";

import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype } from "@/db";
import Image from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

export type BattleView = { enemyName: string; enemyType: "enemy" | "elite" | "boss"; enemyLevel: number; playerLevel: number; lives: number; state: "active" | "defeated" | "completed"; archetype: Archetype };
export type BattleResultItem = { name: string; passed: boolean };
export type BattleAction = "run" | "test" | "research" | "revive";
export type BattleFeedback = "enemy" | "player" | null;
type VictoryResult = { newlyCompleted?: boolean; gainedXp?: number; battle?: { state: BattleView["state"] } | null };

const ENEMY_ASSETS: Record<string, string> = {
  "Espectro do Esqueleto": "/battles/enemies/espectro-do-esqueleto-v1.png",
};
const ARENA_ASSETS: Record<string, string> = {
  HTML: "/campaigns/html/ruinas-da-estrutura-v1.png",
  CSS: "/campaigns/css/distrito-sem-cor-v1.png",
  JAVASCRIPT: "/campaigns/javascript/bosque-fundamentos-v1.png",
  SQL: "/campaigns/sql/arquivo-perdido-v1.png",
};

export function BattleHeader({ battle, pathSlug, pathLabel, title, xpReward }: { battle?: BattleView; pathSlug: string; pathLabel: string; title: string; xpReward: number }) {
  return <header className="battle-page-header">
    <a href={`/trilhas/${pathSlug}`}>← <span>Voltar ao mapa</span></a>
    <div><small>{pathLabel}</small><strong>{title}</strong></div>
    <div className="battle-header-status"><BattleLives lives={battle?.lives ?? 3} /><b>+{xpReward} XP</b></div>
  </header>;
}

export function useBattleVictory(pathSlug: string, review: boolean) {
  const [victoryXp, setVictoryXp] = useState<number | null>(null);
  useEffect(() => {
    if (victoryXp === null) return;
    const timer = window.setTimeout(() => window.location.assign(`/trilhas/${pathSlug}`), 2600);
    return () => window.clearTimeout(timer);
  }, [pathSlug, victoryXp]);
  return {
    victoryXp,
    registerVictory(result: VictoryResult) {
      if (!review && result.newlyCompleted && result.battle?.state === "completed") setVictoryXp(result.gainedXp ?? 0);
    },
  };
}

export function BattlePanel({ battle, technology, objective, results, hint, feedback, loading, onRevive, victoryXp, review }: {
  battle: BattleView;
  technology: string;
  objective: string;
  results?: BattleResultItem[];
  hint?: string | null;
  feedback: BattleFeedback;
  loading: BattleAction | null;
  onRevive: () => void;
  victoryXp: number | null;
  review: boolean;
}) {
  const objectives = publicObjectives(objective);
  const visibleResults = (results?.length ? results : objectives.map((name) => ({ name, passed: false }))).map((result, index) => ({ ...result, name: objectives[index] ?? result.name }));
  const passed = results?.filter((result) => result.passed).length ?? 0;
  const hp = battle.state === "completed" ? 0 : results?.length ? Math.round((results.length - passed) / results.length * 100) : 100;
  const enemyAsset = ENEMY_ASSETS[battle.enemyName];
  const arenaAsset = ARENA_ASSETS[technology.toUpperCase()];

  return <aside className={`battle-panel battle-${battle.state} type-${battle.enemyType}${feedback ? ` hit-${feedback}` : ""}${victoryXp !== null ? " victory-sequence" : ""}`} data-testid="battle-panel">
    <span className="battle-panel-kicker">BATALHA · {technology.toUpperCase()}</span>
    <div className="battle-arena" style={arenaAsset ? { "--battle-arena-image": `url('${arenaAsset}')` } as CSSProperties : undefined} aria-label={`Você contra ${battle.enemyName}`}>
      <div className="battle-combatant battle-player"><PixelHero archetype={battle.archetype} /><strong>VOCÊ</strong><small>Nível {battle.playerLevel}</small></div>
      <b className="battle-vs">VS</b>
      <div className="battle-combatant battle-enemy">{enemyAsset ? <Image src={enemyAsset} alt={`Sprite de ${battle.enemyName}`} width={190} height={210} /> : <div className={`pixel-enemy pixel-enemy-${battle.enemyType}`} aria-hidden="true"><i className="enemy-eye" /><i className="enemy-eye" /><i className="enemy-body" /><i className="enemy-crown" /></div>}<strong>{battle.enemyName}</strong><small>Nível {battle.enemyLevel}</small><div className="enemy-hp" data-testid="enemy-hp"><div><span>HP DO INIMIGO</span><b>{hp} / 100 HP</b></div><div className="enemy-hp-track" role="meter" aria-label={`${battle.enemyName} com ${hp} de 100 HP`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={hp}><i style={{ width: `${hp}%` }} /></div></div></div>
      {victoryXp !== null ? <div className="battle-victory-overlay" data-testid="victory-sequence" aria-live="assertive"><span>INIMIGO DERROTADO</span><strong>CONCLUÍDO</strong>{victoryXp > 0 ? <b>+{victoryXp} XP</b> : null}</div> : null}
    </div>
    <section className="battle-objectives" data-testid="battle-objectives"><h2>◎ OBJETIVOS DA BATALHA</h2>{visibleResults.map((result) => <p className={result.passed ? "passed" : "pending"} key={result.name}><span>{result.passed ? "✓" : "○"}</span>{result.name}</p>)}</section>
    {hint ? <div className="battle-tip"><b>Dica:</b> {hint}</div> : null}
    {battle.state === "defeated" ? <div className="battle-state-overlay"><strong>DERROTADO</strong><p>Você ficou sem vidas nesta batalha.</p><button className="button" disabled={loading !== null} onClick={onRevive}>{loading === "revive" ? "RECUPERANDO…" : "TENTAR NOVAMENTE"}</button></div> : null}
    {battle.state === "completed" && victoryXp === null ? <div className="battle-victory-banner"><strong>{review ? "REVISÃO" : "CONCLUÍDO"}</strong><span>{battle.enemyName} derrotado</span></div> : null}
  </aside>;
}

export function BattleActions({ battle, loading, onAction, victory = false }: { battle?: BattleView; loading: BattleAction | null; onAction: (action: BattleAction) => void; victory?: boolean }) {
  if (battle?.state === "defeated") return <section className="battle-actions"><button className="battle-action attack" aria-label="Tentar batalha novamente" disabled={loading !== null} onClick={() => onAction("revive")}>{loading === "revive" ? "RECUPERANDO…" : "♥ TENTAR NOVAMENTE"}</button></section>;
  return <section className="battle-actions" aria-label="Ações da batalha">
    <button className="battle-action research" aria-label="Pesquisar uma dica sem perder vida" disabled={loading !== null || victory} onClick={() => onAction("research")}>⌕ <span>PESQUISAR</span></button>
    <button className="battle-action run" aria-label="Testar código sem perder vida" disabled={loading !== null || victory} onClick={() => onAction("run")}>△ <span>{loading === "run" ? "TESTANDO…" : "TESTAR"}</span></button>
    <button className="battle-action attack" aria-label="Atacar com a solução; uma solução incorreta perde uma vida" disabled={loading !== null || battle?.state === "completed" || victory} onClick={() => onAction("test")}>⚔ <span>{loading === "test" ? "ATACANDO…" : "ATACAR"}</span><small>Solução incorreta: −1 ♥</small></button>
  </section>;
}

export function BattleLives({ lives }: { lives: number }) {
  return <div className="battle-lives-ui" aria-label={`${lives} vidas restantes`}>{[1, 2, 3].map((life) => <span className={life <= lives ? "alive" : "lost"} key={life}>♥</span>)}</div>;
}

function publicObjectives(objective: string) {
  const parts = objective.split(/\s+e\s+(?=(?:um|uma|adicione|crie|defina|inclua|use|liste)\b)/i).map((part) => part.trim().replace(/[.]$/, ""));
  return parts.length > 1 ? parts : [objective];
}
