"use client";

import Editor, { loader } from "@monaco-editor/react";
import type { MissionStudyMaterial } from "@/db";
import { useState } from "react";
import { BattleActions, BattleHeader, BattlePanel, BattleStudyOverlay, useBattleVictory, type BattleAction, type BattleFeedback, type BattleResultItem, type BattleView } from "./battle-card";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

type MissionView = { slug: string; pathSlug: string; pathLabel: string; technologyName: string; xpReward: number; title: string; briefing: string; objective: string; starterCode: string; functionName: string; completed: boolean; nextMissionSlug: string | null; study: MissionStudyMaterial | null };
type Submission = { ok: boolean; compiled?: boolean; message: string; results?: BattleResultItem[]; gainedXp?: number; totalXp?: number; newlyCompleted?: boolean; unlockedSlug?: string | null; battle?: { lives: number; state: BattleView["state"]; hint?: string } | null };

export function MissionWorkspace({ mission, initialBattle }: { mission: MissionView; initialBattle?: BattleView }) {
  const [code, setCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [battle, setBattle] = useState(initialBattle);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState<BattleAction | null>(null);
  const [feedback, setFeedback] = useState<BattleFeedback>(null);
  const [studyOpen, setStudyOpen] = useState(Boolean(mission.study));
  const [studyStarted, setStudyStarted] = useState(false);
  const { victoryXp, registerVictory } = useBattleVictory(mission.pathSlug, mission.completed);

  async function submit(mode: BattleAction) {
    setLoading(mode); setFeedback(null);
    if (mode === "run" || mode === "test" || mode === "revive") setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, mode }) });
      const result = await response.json() as Submission;
      if (mode === "research" && response.ok && mission.study) setStudyOpen(true);
      if (mode === "test") registerVictory(result);
      if (mode === "run" || mode === "test") setSubmission(result);
      if (result.battle && battle) setBattle({ ...battle, ...result.battle });
      if (result.battle?.hint) setHint(result.battle.hint);
      if (mode === "run" && result.results?.some((item) => item.passed)) setFeedback("enemy");
      if (mode === "test") setFeedback(result.battle && battle && result.battle.lives < battle.lives ? "player" : result.ok || result.results?.some((item) => item.passed) ? "enemy" : "player");
    } catch { setSubmission({ ok: false, message: "Não foi possível avaliar agora. Tente novamente." }); }
    finally { setLoading(null); }
  }

  const results = submission?.results;
  return <div className={`battle-screen${feedback ? ` hit-${feedback}` : ""}`} data-testid="battle-workspace">
    <BattleHeader battle={battle} pathSlug={mission.pathSlug} pathLabel={mission.pathLabel} title={mission.title} xpReward={mission.xpReward} />
    <div className="battle-ide-layout no-preview">
      {battle ? <BattlePanel battle={battle} technology={mission.technologyName} objective={mission.objective} results={results} hint={hint} feedback={feedback} loading={loading} onRevive={() => submit("revive")} victoryXp={victoryXp} review={mission.completed} /> : null}
      <section className="editor-panel battle-code-editor"><div className="editor-tabs"><span><b>JS</b> {mission.functionName}.js</span><button type="button" onClick={() => { setCode(mission.starterCode); setSubmission(null); }}>↻ Resetar</button></div><div data-testid="code-editor" className="editor-surface"><Editor height="100%" language="javascript" theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, fontFamily: "var(--font-geist-mono)", minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2, wordWrap: "on" }} /></div></section>
      <section className="battle-console-panel"><header><span>CONSOLE · RESULTADOS</span>{results?.length ? <b>✓ {results.filter((item) => item.passed).length}/{results.length} testes OK</b> : null}</header><div className="battle-console-output" aria-live="polite">{!submission ? <p className="console-empty">Teste livremente. Somente um ataque incorreto perde vida.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{results?.map((result) => <p key={result.name}><b>{result.passed ? "✓" : "×"}</b> {result.name}</p>)}{submission.gainedXp ? <div className="reward-banner"><span>INIMIGO DERROTADO</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima batalha →</a> : submission.ok && battle?.state === "completed" ? <a className="next-mission" href={`/trilhas/${mission.pathSlug}`}>Voltar ao mapa →</a> : null}</>}</div></section>
      <BattleActions battle={battle} loading={loading} onAction={submit} victory={victoryXp !== null} />
    </div>
    {studyOpen && mission.study && battle ? <BattleStudyOverlay material={mission.study} enemyType={battle.enemyType} started={studyStarted} onContinue={() => { setStudyStarted(true); setStudyOpen(false); }} /> : null}
  </div>;
}
