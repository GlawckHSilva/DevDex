"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useMemo, useState } from "react";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

type Mission = { slug: string; title: string; briefing: string; objective: string; starterCode: string; functionName: string; xpReward: number };
type Battle = { zoneName: string; kind: "enemy" | "elite" | "boss" | "checkpoint"; enemyName: string; enemyClass: string; enemySprite: string; mentorBrief: string; lives: number };
type Submission = { ok: boolean; message: string; results?: { name: string; passed: boolean }[]; gainedXp?: number; totalXp?: number; unlockedSlug?: string | null; enemyHpPercent?: number; battle?: { lives: number; defeated: boolean; nextBattleLives: number; perfect: boolean } | null };

function Hearts({ lives }: { lives: number }) { return <span className="battle-hearts" aria-label={`${lives} vidas restantes`}>{[0, 1, 2].map((heart) => <i className={heart < lives ? "full" : "empty"} key={heart}>♥</i>)}</span>; }

export function BattleWorkspace({ mission, battle }: { mission: Mission; battle: Battle }) {
  const [code, setCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<"run" | "attack" | null>(null);
  const [lives, setLives] = useState(battle.lives);
  const [showCodex, setShowCodex] = useState(false);
  const enemyHp = useMemo(() => submission?.enemyHpPercent ?? 100, [submission]);

  async function submit(mode: "run" | "attack") {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, mode }) });
      const result = await response.json() as Submission;
      setSubmission(result);
      if (result.battle) setLives(result.battle.defeated ? 3 : result.battle.lives);
    } catch { setSubmission({ ok: false, message: "Não foi possível avaliar agora. Tente novamente." }); }
    finally { setLoading(null); }
  }

  return <div className="battle-page">
    <header className="battle-topbar"><a href="/jornada">← Mapa</a><span>{battle.zoneName}</span><strong>{battle.kind === "boss" ? "BOSS BATTLE" : "BATALHA DE CÓDIGO"}</strong></header>
    <section className={`battle-stage enemy-${battle.enemySprite} ${submission?.ok ? "attack-success" : submission?.battle && !submission.ok ? "attack-failed" : ""}`}>
      <div className="battle-combatant player"><span className="sprite-avatar">&lt;/&gt;</span><strong>VOCÊ</strong><small>Programador aventureiro</small></div>
      <div className="battle-versus">VS</div>
      <div className="battle-combatant enemy"><span className="sprite-avatar">{battle.kind === "boss" ? "!" : "?"}</span><strong>{battle.enemyName}</strong><small>{battle.enemyClass}</small><div className="enemy-hp"><span><b>HP</b> {enemyHp}%</span><i><em style={{ width: `${enemyHp}%` }} /></i></div></div>
      <div className="battle-lives"><small>SUAS VIDAS</small><Hearts lives={lives} /></div>
    </section>
    <section className="battle-brief"><div className="mentor-inline"><span className="mentor-pixel">DX</span><p><b>Dex:</b> {battle.mentorBrief}</p></div><div><span className="kicker">OBJETIVO · {mission.xpReward} XP</span><h1>{mission.title}</h1><p>{mission.objective}</p></div><p className="battle-rule"><b>TESTAR</b> é livre. <b>ATACAR</b> envia a solução oficial e pode custar uma vida.</p></section>
    <section className="battle-editor"><div className="editor-tabs"><span>● {mission.functionName}.js</span><button type="button" onClick={() => { setCode(mission.starterCode); setSubmission(null); }}>↺ Resetar</button></div><div className="battle-editor-surface"><Editor height="100%" language="javascript" theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, fontFamily: "var(--font-geist-mono)", minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2, wordWrap: "on" }} /></div></section>
    <section className="battle-console"><div className="battle-actions"><div><button className="button button-ghost" type="button" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Testando…" : "▷ TESTAR"}</button><button className="button button-attack" type="button" disabled={loading !== null} onClick={() => submit("attack")}>{loading === "attack" ? "Atacando…" : "⚡ ATACAR"}</button><button className="codex-button" type="button" onClick={() => setShowCodex((visible) => !visible)}>⌕ DEVDEX CODEX</button></div><span>O teste não consome vida</span></div>
      {showCodex ? <aside className="devdex-codex"><strong>Pesquisar faz parte do jogo</strong><p>Leia a documentação, compare exemplos e tente outra abordagem. A resposta desta missão não é exibida aqui.</p><a href="https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Guide/Grammar_and_types" target="_blank" rel="noreferrer">Abrir guia de JavaScript no MDN ↗</a></aside> : null}
      <div className="battle-results" aria-live="polite">{!submission ? <p>Escreva uma hipótese, rode <b>TESTAR</b> quantas vezes quiser e só então use <b>ATACAR</b>.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.results?.map((result) => <p key={result.name} className={result.passed ? "passed" : ""}>{result.passed ? "✓" : "×"} {result.name}</p>)}{submission.battle?.defeated ? <div className="battle-defeat"><strong>DERROTA — a batalha foi reiniciada.</strong><p>Seu progresso, XP e inimigos já vencidos continuam intactos. Você voltou com 3 vidas.</p></div> : null}{submission.battle?.perfect ? <div className="perfect-battle">PERFECT BATTLE</div> : null}{submission.gainedXp ? <div className="reward-banner"><span>INIMIGO DERROTADO</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href="/jornada">Voltar ao mapa →</a> : submission.ok ? <a className="next-mission" href="/jornada">Ver jornada →</a> : null}</>}</div>
    </section>
  </div>;
}
