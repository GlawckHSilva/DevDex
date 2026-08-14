"use client";

import Editor from "@monaco-editor/react";
import type { MissionStudyMaterial } from "@/db";
import { useMemo, useState } from "react";
import { BattleActions, BattleHeader, BattlePanel, BattleStudyOverlay, useBattleVictory, type BattleAction, type BattleFeedback, type BattleResultItem, type BattleView } from "./battle-card";

type WebMission = { slug: string; title: string; briefing: string; objective: string; starterCode: string; completed: boolean; nextMissionSlug: string | null; pathSlug: string; pathLabel: string; technologyName: string; xpReward: number; documentType: "html" | "css"; previewHtml: string; previewCss: string; study: MissionStudyMaterial | null };
type Submission = { ok: boolean; message: string; results?: BattleResultItem[]; gainedXp?: number; newlyCompleted?: boolean; unlockedSlug?: string | null; battle?: { lives: number; state: BattleView["state"]; hint?: string } | null };
const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none'; navigate-to 'none'";

function previewDocument(mission: WebMission, code: string) {
  const html = mission.documentType === "html" ? code : mission.previewHtml;
  const css = mission.documentType === "css" ? code : mission.previewCss;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>${css}</style></head><body>${html}</body></html>`;
}

export function WebWorkspace({ mission, initialBattle }: { mission: WebMission; initialBattle?: BattleView }) {
  const [code, setCode] = useState(mission.starterCode);
  const [previewCode, setPreviewCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [battle, setBattle] = useState(initialBattle);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState<BattleAction | null>(null);
  const [feedback, setFeedback] = useState<BattleFeedback>(null);
  const [studyOpen, setStudyOpen] = useState(Boolean(mission.study));
  const [studyStarted, setStudyStarted] = useState(false);
  const { victoryXp, registerVictory } = useBattleVictory(mission.pathSlug, mission.completed);
  const srcDoc = useMemo(() => previewDocument(mission, previewCode), [mission, previewCode]);

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
      if (response.ok && (mode === "run" || mode === "test")) setPreviewCode(code);
      if (mode === "run" && result.results?.some((item) => item.passed)) setFeedback("enemy");
      if (mode === "test") setFeedback(result.battle && battle && result.battle.lives < battle.lives ? "player" : result.ok || result.results?.some((item) => item.passed) ? "enemy" : "player");
    } catch { setSubmission({ ok: false, message: "Não foi possível validar o preview agora." }); }
    finally { setLoading(null); }
  }

  const results = submission?.results;
  const passed = results?.filter((result) => result.passed).length ?? 0;
  return <div className={`battle-screen${feedback ? ` hit-${feedback}` : ""}`} data-testid="battle-workspace">
    <BattleHeader battle={battle} pathSlug={mission.pathSlug} pathLabel={mission.pathLabel} title={mission.title} xpReward={mission.xpReward} />
    <div className="battle-ide-layout">
      {battle ? <BattlePanel battle={battle} technology={mission.technologyName} objective={mission.objective} results={results} hint={hint} feedback={feedback} loading={loading} onRevive={() => submit("revive")} victoryXp={victoryXp} review={mission.completed} /> : null}
      <section className="editor-panel battle-code-editor"><div className="editor-tabs"><span><b>{mission.documentType === "html" ? "▱" : "#"}</b> index.{mission.documentType}</span><button onClick={() => { setCode(mission.starterCode); setPreviewCode(mission.starterCode); setSubmission(null); }}>↺ Resetar</button></div><div className="editor-surface" data-testid="web-editor"><Editor height="100%" language={mission.documentType} theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2 }} /></div></section>
      <section className="battle-preview"><div className="battle-preview-title"><span>▣ PRÉ-VISUALIZAÇÃO</span><small>AMBIENTE ISOLADO</small></div><div className="browser-frame"><div className="browser-bar"><i /><i /><i /><span>▣ preview.devdex.local</span><b>↻</b></div><iframe title="Preview da missão" sandbox="" referrerPolicy="no-referrer" srcDoc={srcDoc} /></div></section>
      <section className="battle-console-panel"><header><span>CONSOLE · RESULTADOS</span>{results?.length ? <b>✓ {passed}/{results.length} testes OK</b> : null}</header><div className="battle-console-output" aria-live="polite">{!submission ? <p className="console-empty">Teste livremente. Somente um ataque incorreto perde vida.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{results?.map((result) => <p key={result.name}><b>{result.passed ? "✓" : "×"}</b> {result.name}</p>)}{submission.gainedXp ? <div className="reward-banner"><span>INIMIGO DERROTADO</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima batalha →</a> : submission.ok && battle?.state === "completed" ? <a className="next-mission" href={`/trilhas/${mission.pathSlug}`}>Voltar ao mapa →</a> : null}</>}</div></section>
      <BattleActions battle={battle} loading={loading} onAction={submit} victory={victoryXp !== null} />
    </div>
    {studyOpen && mission.study && battle ? <BattleStudyOverlay material={mission.study} enemyType={battle.enemyType} started={studyStarted} onContinue={() => { setStudyStarted(true); setStudyOpen(false); }} /> : null}
  </div>;
}
