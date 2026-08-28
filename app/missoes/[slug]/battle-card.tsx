"use client";

import { PixelHero } from "@/app/aventura/character-select";
import type { Archetype, MissionStudyMaterial } from "@/db";
import { ENEMY_ASSETS } from "@/lib/enemy-assets";
import { audioEnabled, playBattleSound, setAudioEnabled } from "@/lib/game-audio";
import * as Tabs from "@radix-ui/react-tabs";
import * as Toast from "@radix-ui/react-toast";
import * as Tooltip from "@radix-ui/react-tooltip";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { ArrowLeft, Code2, FlaskConical, Lightbulb, ListChecks, ScrollText, Swords, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import Image from "next/image";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export type BattleView = { enemyName: string; enemyType: "enemy" | "elite" | "boss"; enemyLevel: number; playerLevel: number; lives: number; state: "active" | "defeated" | "completed"; archetype: Archetype };
export type BattleResultItem = { name: string; passed: boolean };
export type BattleAction = "run" | "test" | "research" | "revive";
export type BattleFeedback = "enemy" | "player" | null;
type VictoryResult = { newlyCompleted?: boolean; gainedXp?: number; battle?: { state: BattleView["state"] } | null };

const battleActionClass = cva("battle-action", {
  variants: { intent: { research: "research", run: "run", attack: "attack" } },
});

const ARENA_ASSETS: Record<string, string> = {
  HTML: "/campaigns/html/ruinas-da-estrutura-v1.png",
  CSS: "/campaigns/css/distrito-sem-cor-v1.png",
  JAVASCRIPT: "/campaigns/javascript/bosque-fundamentos-v1.png",
  SQL: "/campaigns/sql/arquivo-perdido-v1.png",
};

export function BattleStudyOverlay({ material, enemyType, pathSlug, started, onContinue }: { material: MissionStudyMaterial; enemyType: BattleView["enemyType"]; pathSlug: string; started: boolean; onContinue: () => void }) {
  return <section className="battle-study-overlay" role="dialog" aria-modal="true" aria-labelledby="study-title" data-testid="study-material">
    <article className="battle-study-card">
      <header><span>{enemyType === "boss" ? "AULA DO CHEFÃO" : "AULA EXPLICATIVA"}</span><small>ETAPA 1 DE 2 · APRENDER</small><div className="lesson-stepper" aria-label="Fluxo da missão"><strong>1 · EXPLICAÇÃO</strong><i>→</i><span>2 · PRÁTICA</span></div><h1 id="study-title">{material.title}</h1><p>{material.introduction}</p></header>
      <div className="battle-study-content">
        <section><h2>Antes de enfrentar este inimigo</h2><p>{material.explanation}</p><h2>Exemplo</h2><pre><code>{material.exampleCode}</code></pre><p>{material.exampleExplanation}</p></section>
        <aside><h2>Pontos importantes</h2><ul>{material.keyPoints.map((item) => <li key={item}>{item}</li>)}</ul>{material.commonMistakes.length ? <><h2>Erros comuns</h2><ul className="study-mistakes">{material.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></> : null}</aside>
      </div>
      <footer><p>O exemplo ensina o conceito. Na etapa seguinte você vai aplicá-lo sem receber a solução pronta.</p><div className="study-footer-actions"><a className="button study-back-link" href={`/trilhas/${pathSlug}`}><ArrowLeft aria-hidden="true" size={16} /> VOLTAR AO MAPA</a><button className="button" data-testid="start-battle" onClick={onContinue}><Swords aria-hidden="true" size={17} /> {started ? "VOLTAR À PRÁTICA" : "IR PARA A PRÁTICA"}</button></div></footer>
    </article>
  </section>;
}

export function BattleHeader({ battle, pathSlug, pathLabel, title, xpReward }: { battle?: BattleView; pathSlug: string; pathLabel: string; title: string; xpReward: number }) {
  return <header className="battle-page-header">
    <div className="battle-header-start"><a className="battle-brand" href="/dashboard">Dev<span>Dex</span></a><a className="battle-back" href={`/trilhas/${pathSlug}`}><ArrowLeft aria-hidden="true" size={17} /> <span>Voltar para o mapa</span></a></div>
    <div className="battle-header-mission"><small>{pathLabel}</small><strong>{title}</strong></div>
    <div className="battle-header-status"><BattleAudioToggle /><div className="battle-xp"><span>◈ Nível {battle?.playerLevel ?? 1}</span><div><i style={{ width: `${Math.min(88, 34 + xpReward / 3)}%` }} /></div><small>+{xpReward} XP na missão</small></div><BattleLives lives={battle?.lives ?? 3} /></div>
  </header>;
}

export function useBattleVictory(pathSlug: string, review: boolean) {
  const [victoryXp, setVictoryXp] = useState<number | null>(null);
  useEffect(() => {
    if (victoryXp === null) return;
    const timer = window.setTimeout(() => window.location.assign(`/trilhas/${pathSlug}?victory=1`), 2600);
    return () => window.clearTimeout(timer);
  }, [pathSlug, victoryXp]);
  return {
    victoryXp,
    registerVictory(result: VictoryResult) {
      if (!review && result.newlyCompleted && result.battle?.state === "completed") { setVictoryXp(result.gainedXp ?? 0); playBattleSound("victory"); }
    },
  };
}

export function useBattleFeedbackAudio(feedback: BattleFeedback) {
  useEffect(() => { if (feedback) playBattleSound(feedback); }, [feedback]);
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

  return <MotionConfig reducedMotion="user"><aside className={`battle-panel battle-${battle.state} type-${battle.enemyType}${feedback ? ` hit-${feedback}` : ""}${hint ? " has-hint" : ""}${victoryXp !== null ? " victory-sequence" : ""}`} data-testid="battle-panel">
    <header className="battle-enemy-heading"><div><strong>{battle.enemyName}</strong><small>Nível {battle.enemyLevel}</small></div><span>{review ? "REPETIÇÃO · 0 XP" : `BATALHA · ${technology.toUpperCase()}`}</span></header>
    <div className="battle-arena" style={arenaAsset ? { "--battle-arena-image": `url('${arenaAsset}')` } as CSSProperties : undefined} aria-label={`Você contra ${battle.enemyName}`}>
      <div className="battle-combatant battle-player" aria-hidden="true"><PixelHero archetype={battle.archetype} /><span>VOCÊ</span></div>
      <b className="battle-vs">VS</b>
      <div className="battle-combatant battle-enemy">{enemyAsset ? <Image src={enemyAsset} alt={`Sprite de ${battle.enemyName}`} width={190} height={210} /> : <div className={`pixel-enemy pixel-enemy-${battle.enemyType}`} aria-hidden="true"><i className="enemy-eye" /><i className="enemy-eye" /><i className="enemy-body" /><i className="enemy-crown" /></div>}<div className="enemy-hp" data-testid="enemy-hp"><div><span>HP</span><b>{hp} / 100 HP</b></div><div className="enemy-hp-track" role="meter" aria-label={`${battle.enemyName} com ${hp} de 100 HP`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={hp}><i style={{ width: `${hp}%` }} /></div></div></div>
      <AnimatePresence>{victoryXp !== null ? <motion.div className="battle-victory-overlay" data-testid="victory-sequence" aria-live="assertive" initial={{ opacity: 0, scale: .86 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .35, ease: "easeOut" }}><span>INIMIGO DERROTADO</span><strong>CONCLUÍDO</strong>{victoryXp > 0 ? <b>+{victoryXp} XP</b> : null}</motion.div> : null}</AnimatePresence>
    </div>
    <section className="battle-objectives" data-testid="battle-objectives"><h2>⚗ TESTES <b>{passed}/{visibleResults.length}</b></h2>{visibleResults.map((result) => <p className={result.passed ? "passed" : "pending"} key={result.name}><span>{result.passed ? "✓" : "○"}</span>{result.name}</p>)}{results?.length ? <BattleCoach results={visibleResults} hint={hint} /> : null}</section>
    {battle.state === "defeated" ? <div className="battle-state-overlay"><strong>DERROTADO</strong><p>Você ficou sem vidas nesta batalha.</p><button className="button" disabled={loading !== null} onClick={onRevive}>{loading === "revive" ? "RECUPERANDO…" : "TENTAR NOVAMENTE"}</button></div> : null}
    {battle.state === "completed" && victoryXp === null ? <div className="battle-victory-banner"><strong>{review ? "REVISÃO" : "CONCLUÍDO"}</strong><span>{battle.enemyName} derrotado</span></div> : null}
  </aside></MotionConfig>;
}

export function BattleBriefPanel({ briefing, objective, hint }: { briefing: string; objective: string; hint?: string | null }) {
  const objectives = publicObjectives(objective);
  return <aside className="battle-brief-panel">
    <section><span className="battle-brief-kicker">⚑ MISSÃO</span><p>{briefing}</p></section>
    <section className="battle-brief-objectives"><h2>◎ OBJETIVOS</h2>{objectives.map((item) => <p key={item}><span>○</span>{item}</p>)}</section>
    <details className="battle-brief-hint" open={Boolean(hint)}><summary>💡 PISTA <b>⌄</b></summary><p>{hint ?? "Teste seu código sem medo: somente uma solução atacada incorretamente consome vida."}</p></details>
  </aside>;
}

export function BattleTabs({ children, className }: { children: ReactNode; className?: string }) {
  return <Tabs.Root className={clsx("battle-ide-layout", className)} defaultValue="mission">{children}</Tabs.Root>;
}

export function BattleTabList() {
  return <Tabs.List className="battle-mobile-tabs" aria-label="Áreas da batalha">
    <Tabs.Trigger value="mission"><ScrollText aria-hidden="true" size={16} />Missão</Tabs.Trigger>
    <Tabs.Trigger value="arena"><Swords aria-hidden="true" size={16} />Arena</Tabs.Trigger>
    <Tabs.Trigger value="code"><Code2 aria-hidden="true" size={16} />Código</Tabs.Trigger>
    <Tabs.Trigger value="results"><ListChecks aria-hidden="true" size={16} />Resultados</Tabs.Trigger>
  </Tabs.List>;
}

export function BattleTabPanel({ children, value }: { children: ReactNode; value: "mission" | "arena" | "code" | "results" }) {
  return <Tabs.Content className="battle-tab-panel" data-value={value} forceMount hidden={false} value={value}>{children}</Tabs.Content>;
}

export function BattleToast({ message, success }: { message: string; success: boolean }) {
  return <Toast.Provider duration={3500} swipeDirection="right"><Toast.Root className={clsx("battle-toast", success ? "success" : "error")} defaultOpen data-testid="battle-toast"><Toast.Title>{success ? "Teste concluído" : "Revise a solução"}</Toast.Title><Toast.Description>{message}</Toast.Description><Toast.Close aria-label="Fechar notificação"><X aria-hidden="true" size={15} /></Toast.Close></Toast.Root><Toast.Viewport className="battle-toast-viewport" /></Toast.Provider>;
}

export function BattleActions({ battle, loading, onAction, victory = false }: { battle?: BattleView; loading: BattleAction | null; onAction: (action: BattleAction) => void; victory?: boolean }) {
  if (battle?.state === "defeated") return <section className="battle-actions"><button className={battleActionClass({ intent: "attack" })} aria-label="Tentar batalha novamente" disabled={loading !== null} onClick={() => onAction("revive")}>{loading === "revive" ? "RECUPERANDO…" : "♥ TENTAR NOVAMENTE"}</button></section>;
  return <Tooltip.Provider delayDuration={350}><section className="battle-actions" aria-label="Ações da batalha">
    <span className="battle-safe-note">Ctrl+Enter · Testar<br />Ctrl+Shift+Enter · Atacar</span>
    <ActionTooltip label="Abra o material da missão sem perder vida"><button className={battleActionClass({ intent: "research" })} aria-label="Pesquisar uma dica sem perder vida" disabled={loading !== null || victory} onClick={() => onAction("research")}><Lightbulb aria-hidden="true" size={18} /><span>Ver dica</span></button></ActionTooltip>
    <ActionTooltip label="Execute os testes sem consumir uma vida"><button className={battleActionClass({ intent: "run" })} aria-label="Testar código sem perder vida" disabled={loading !== null || victory} onClick={() => onAction("run")}><FlaskConical aria-hidden="true" size={18} /><span>{loading === "run" ? "Testando…" : "Testar código"}</span></button></ActionTooltip>
    <ActionTooltip label="Ataque com a solução; um erro pode consumir uma vida"><button className={battleActionClass({ intent: "attack" })} aria-label="Atacar com a solução; uma solução incorreta perde uma vida" disabled={loading !== null || battle?.state === "completed" || victory} onClick={() => onAction("test")}><Swords aria-hidden="true" size={21} /><span>{loading === "test" ? "Atacando…" : "Atacar solução"}</span></button></ActionTooltip>
  </section></Tooltip.Provider>;
}

function ActionTooltip({ children, label }: { children: ReactNode; label: string }) {
  return <Tooltip.Root><Tooltip.Trigger asChild>{children}</Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className="battle-tooltip" sideOffset={7}>{label}<Tooltip.Arrow className="battle-tooltip-arrow" /></Tooltip.Content></Tooltip.Portal></Tooltip.Root>;
}

function BattleCoach({ results, hint }: { results: BattleResultItem[]; hint?: string | null }) {
  const next = results.find((result) => !result.passed);
  return <div className={`battle-coach${next ? "" : " complete"}`} role="status"><strong>{next ? "PRÓXIMO PASSO" : "PRONTO PARA ATACAR"}</strong><p>{next ? next.name : "Todos os requisitos foram aprovados."}</p>{next && hint ? <small>{hint}</small> : null}</div>;
}

function BattleAudioToggle() {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { const frame = requestAnimationFrame(() => setEnabled(audioEnabled())); return () => cancelAnimationFrame(frame); }, []);
  return <button className="battle-audio-toggle" type="button" aria-label={enabled ? "Desativar sons" : "Ativar sons"} aria-pressed={enabled} onClick={() => { const next = !enabled; setEnabled(next); setAudioEnabled(next); if (next) playBattleSound("ui"); }}>{enabled ? <Volume2 aria-hidden="true" size={17} /> : <VolumeX aria-hidden="true" size={17} />}</button>;
}

export function BattleLives({ lives }: { lives: number }) {
  return <div className="battle-lives-ui" aria-label={`${lives} vidas restantes`}>{[1, 2, 3].map((life) => <span className={life <= lives ? "alive" : "lost"} key={life}>♥</span>)}</div>;
}

function publicObjectives(objective: string) {
  const parts = objective.split(/\s+e\s+(?=(?:um|uma|adicione|crie|defina|inclua|use|liste)\b)/i).map((part) => part.trim().replace(/[.]$/, ""));
  return parts.length > 1 ? parts : [objective];
}
