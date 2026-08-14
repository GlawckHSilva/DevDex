"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useState } from "react";
import { PixelHero } from "@/app/aventura/character-select";
import type { BattleView } from "./battle-card";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

type MissionView = { slug: string; pathSlug: string; title: string; briefing: string; objective: string; starterCode: string; functionName: string; completed: boolean; nextMissionSlug: string | null };
type Submission = { ok: boolean; compiled?: boolean; message: string; results?: { name: string; passed: boolean }[]; gainedXp?: number; totalXp?: number; unlockedSlug?: string | null; battle?: { lives: number; state: BattleView["state"]; hint?: string } | null };
type Action = "run" | "test" | "research" | "revive";

export function MissionWorkspace({ mission, initialBattle }: { mission: MissionView; initialBattle?: BattleView }) {
  const [code, setCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [battle, setBattle] = useState(initialBattle);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState<Action | null>(null);

  async function submit(mode: Action) {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, mode }) });
      const result = await response.json() as Submission;
      setSubmission(result);
      if (result.battle && battle) setBattle({ ...battle, ...result.battle });
      if (result.battle?.hint) setHint(result.battle.hint);
    } catch { setSubmission({ ok: false, message: "Não foi possível avaliar agora. Tente novamente." }); }
    finally { setLoading(null); }
  }

  const editor = <EditorPanel mission={mission} code={code} setCode={setCode} reset={() => { setCode(mission.starterCode); setSubmission(null); }} />;
  if (!battle) return <div className="workspace-grid">
    <Briefing mission={mission} />{editor}<ResultPanel submission={submission} loading={loading} submit={submit} />
  </div>;

  return <div className={`battle-workspace battle-${battle.state}`} data-testid="battle-workspace">
    <BattleScene battle={battle} />
    <aside className="battle-briefing"><a href={`/trilhas/${mission.pathSlug}`}>← Voltar à campanha</a><span className="kicker">MISSÃO DE BATALHA</span><h1>{mission.title}</h1><p>{mission.briefing}</p><div className="objective"><small>OBJETIVO DO ATAQUE</small><p>{mission.objective}</p></div>{hint ? <div className="battle-hint"><small>CONHECIMENTO ENCONTRADO</small><p>{hint}</p></div> : null}</aside>
    {editor}
    <section className="console-panel battle-console">
      <div className="console-actions"><span>COMANDOS</span><div>{battle.state === "defeated" ? <button className="button" disabled={loading !== null} onClick={() => submit("revive")}>{loading === "revive" ? "Recuperando…" : "♥ REVIVER"}</button> : <><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Testando…" : "▷ TESTAR"}</button><button className="button" disabled={loading !== null || battle.state === "completed"} onClick={() => submit("test")}>{loading === "test" ? "Atacando…" : "⚔ ATACAR"}</button><button className="button button-research" disabled={loading !== null} onClick={() => submit("research")}>{loading === "research" ? "Buscando…" : "⌕ PESQUISAR"}</button></>}</div></div>
      <BattleResult mission={mission} submission={submission} battle={battle} />
    </section>
  </div>;
}

function BattleScene({ battle }: { battle: BattleView }) {
  return <section className="battle-scene" aria-label={`Batalha contra ${battle.enemyName}`}><div className="battle-sky"><i /><i /><i /></div><div className="battle-ground" /><div className="battle-fighter hero-fighter"><PixelHero archetype={battle.archetype} /><strong>VOCÊ</strong></div><div className="battle-versus">VS</div><div className="battle-fighter enemy-fighter"><div className={`pixel-enemy pixel-enemy-${battle.enemyType}`}><i className="enemy-eye" /><i className="enemy-eye" /><i className="enemy-body" /><i className="enemy-crown" /></div><strong>{battle.enemyName}</strong><small>NÍVEL {battle.enemyLevel}</small></div><div className="battle-lives" aria-label={`${battle.lives} vidas restantes`}>{[1, 2, 3].map((life) => <span className={life <= battle.lives ? "alive" : "lost"} key={life}>♥</span>)}</div></section>;
}

function EditorPanel({ mission, code, setCode, reset }: { mission: MissionView; code: string; setCode: (code: string) => void; reset: () => void }) {
  return <section className="editor-panel"><div className="editor-tabs"><span>● {mission.functionName}.js</span><button type="button" onClick={reset}>↻ Resetar</button></div><div data-testid="code-editor" className="editor-surface"><Editor height="100%" language="javascript" theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, fontFamily: "var(--font-geist-mono)", minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2, wordWrap: "on" }} /></div></section>;
}

function Briefing({ mission }: { mission: MissionView }) {
  return <aside className="briefing-panel"><a href="/trilhas/javascript-fundamentals">← Voltar à trilha</a><span className="kicker">BRIEFING</span><h1>{mission.title}</h1><p>{mission.briefing}</p><div className="objective"><small>OBJETIVO</small><p>{mission.objective}</p></div><div className="rules"><small>AMBIENTE SEGURO</small><p>Seu JavaScript roda em uma sandbox QuickJS isolada, com limites de tempo e memória e sem acesso à rede ou ao sistema.</p></div></aside>;
}

function ResultPanel({ submission, loading, submit }: { submission: Submission | null; loading: Action | null; submit: (mode: Action) => void }) {
  return <section className="console-panel"><div className="console-actions"><span>CONSOLE & TESTES</span><div><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Executando…" : "▷ Executar"}</button><button className="button" disabled={loading !== null} onClick={() => submit("test")}>{loading === "test" ? "Testando…" : "✓ Testar missão"}</button></div></div><Result submission={submission} /></section>;
}

function Result({ submission }: { submission: Submission | null }) {
  return <div className="console-output" aria-live="polite">{!submission ? <p className="console-empty">Execute o código ou rode os testes privados.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.results?.map((result) => <p key={result.name}><b>{result.passed ? "✓" : "×"}</b> {result.name}</p>)}{submission.gainedXp ? <div className="reward-banner"><span>MISSÃO CONCLUÍDA</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima missão →</a> : submission.ok ? <a className="next-mission" href="/dashboard">Voltar ao dashboard →</a> : null}</>}</div>;
}

function BattleResult({ mission, submission, battle }: { mission: MissionView; submission: Submission | null; battle: BattleView }) {
  if (battle.state === "defeated") return <div className="console-output battle-message"><strong>VOCÊ FOI DERROTADO</strong><p>Recupere suas três vidas e tente uma nova estratégia.</p></div>;
  if (battle.state === "completed") return <div className="console-output battle-message victory"><strong>INIMIGO DERROTADO</strong>{submission?.gainedXp ? <p>+{submission.gainedXp} XP conquistados</p> : <p>Batalha concluída.</p>}<a className="next-mission" href={`/trilhas/${mission.pathSlug}`}>Voltar à campanha →</a></div>;
  return <Result submission={submission} />;
}
