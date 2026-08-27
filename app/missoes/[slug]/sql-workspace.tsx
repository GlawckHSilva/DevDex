"use client";

import Editor from "@monaco-editor/react";
import type { MissionStudyMaterial } from "@/db";
import { useState } from "react";
import { BattleActions, BattleBriefPanel, BattleHeader, BattlePanel, BattleStudyOverlay, useBattleVictory, type BattleAction, type BattleFeedback, type BattleResultItem, type BattleView } from "./battle-card";

type SqlValue = string | number | null;
type TableSchema = { tables: { name: string; columns: { name: string; type: string; primaryKey?: boolean }[] }[] };
type TablePreview = { columns: string[]; rows: SqlValue[][] };
type SqlMission = { slug: string; title: string; briefing: string; objective: string; starterSql: string; completed: boolean; nextMissionSlug: string | null; pathSlug: string; pathLabel: string; technologyName: string; xpReward: number; dialect: string; tableSchema: TableSchema; tablePreview: TablePreview; study: MissionStudyMaterial | null };
type Submission = { ok: boolean; message: string; columns?: string[]; rows?: SqlValue[][]; results?: BattleResultItem[]; gainedXp?: number; newlyCompleted?: boolean; unlockedSlug?: string | null; battle?: { lives: number; state: BattleView["state"]; hint?: string } | null };

function ResultTable({ columns, rows }: { columns: string[]; rows: SqlValue[][] }) {
  return <div className="sql-table-wrap"><table className="sql-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, index) => <td key={index}>{value === null ? <i>NULL</i> : String(value)}</td>)}</tr>)}</tbody></table></div>;
}

export function SqlWorkspace({ mission, initialBattle }: { mission: SqlMission; initialBattle?: BattleView }) {
  const [query, setQuery] = useState(mission.starterSql);
  const [tab, setTab] = useState<"dados" | "estrutura">("estrutura");
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
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: query, mode }) });
      const result = await response.json() as Submission;
      if (mode === "research" && response.ok && mission.study) setStudyOpen(true);
      if (mode === "test") registerVictory(result);
      if (mode === "run" || mode === "test") setSubmission(result);
      if (result.battle && battle) setBattle({ ...battle, ...result.battle });
      if (result.battle?.hint) setHint(result.battle.hint);
      if (mode === "run" && result.results?.some((item) => item.passed)) setFeedback("enemy");
      if (mode === "test") setFeedback(result.battle && battle && result.battle.lives < battle.lives ? "player" : result.ok || result.results?.some((item) => item.passed) ? "enemy" : "player");
    } catch { setSubmission({ ok: false, message: "Não foi possível consultar o banco agora." }); }
    finally { setLoading(null); }
  }

  const results = submission?.results;
  return <div className={`battle-screen${feedback ? ` hit-${feedback}` : ""}`} data-testid="battle-workspace">
    <BattleHeader battle={battle} pathSlug={mission.pathSlug} pathLabel={mission.pathLabel} title={mission.title} xpReward={mission.xpReward} />
    <div className="battle-ide-layout battle-sql-layout">
      <BattleBriefPanel briefing={mission.briefing} objective={mission.objective} hint={hint} />
      {battle ? <BattlePanel battle={battle} technology={mission.technologyName} objective={mission.objective} results={results} hint={hint} feedback={feedback} loading={loading} onRevive={() => submit("revive")} victoryXp={victoryXp} review={mission.completed} /> : null}
      <section className="editor-panel battle-code-editor"><div className="editor-tabs"><span><b>▦</b> consulta.sql</span><button onClick={() => { setQuery(mission.starterSql); setSubmission(null); }}>↺ Resetar</button></div><div className="editor-surface" data-testid="sql-editor"><Editor height="100%" language="sql" theme="vs-dark" value={query} onChange={(value) => setQuery(value ?? "")} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2 }} /></div></section>
      <section className="battle-database"><div className="battle-preview-title"><span>▦ BANCO ISOLADO</span><small>SQLITE DESCARTÁVEL</small></div><div className="database-tabs"><button className={tab === "estrutura" ? "active" : ""} onClick={() => setTab("estrutura")}>Estrutura</button><button className={tab === "dados" ? "active" : ""} onClick={() => setTab("dados")}>Dados</button></div>{tab === "estrutura" ? <div className="schema-tree">{mission.tableSchema.tables.map((table) => <div key={table.name}><strong>▾ {table.name}</strong>{table.columns.map((column) => <span key={column.name}>{column.primaryKey ? "◆ " : ""}{column.name} <small>{column.type}</small></span>)}</div>)}</div> : <ResultTable columns={mission.tablePreview.columns} rows={mission.tablePreview.rows} />}</section>
      <section className="battle-console-panel"><header><span>☷ EXPLICAÇÃO</span>{results?.length ? <b>✓ {results.filter((item) => item.passed).length}/{results.length}</b> : null}</header><div className="battle-console-output" aria-live="polite">{!submission ? <p className="console-empty">Escreva a consulta, teste sem risco e ataque quando estiver pronto.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.columns && submission.rows ? <ResultTable columns={submission.columns} rows={submission.rows} /> : null}{submission.gainedXp ? <div className="reward-banner"><span>INIMIGO DERROTADO</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima batalha →</a> : submission.ok && battle?.state === "completed" ? <a className="next-mission" href={`/trilhas/${mission.pathSlug}`}>Voltar ao mapa →</a> : null}</>}</div></section>
      <BattleActions battle={battle} loading={loading} onAction={submit} victory={victoryXp !== null} />
    </div>
    {studyOpen && mission.study && battle ? <BattleStudyOverlay material={mission.study} enemyType={battle.enemyType} started={studyStarted} onContinue={() => { setStudyStarted(true); setStudyOpen(false); }} /> : null}
  </div>;
}
