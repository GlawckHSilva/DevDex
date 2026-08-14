"use client";

import Editor from "@monaco-editor/react";
import { useState } from "react";
import { BattleCard, type BattleView } from "./battle-card";

type SqlValue = string | number | null;
type TableSchema = { tables: { name: string; columns: { name: string; type: string; primaryKey?: boolean }[] }[] };
type TablePreview = { columns: string[]; rows: SqlValue[][] };
type SqlMission = { slug: string; title: string; briefing: string; objective: string; starterSql: string; completed: boolean; nextMissionSlug: string | null; pathSlug: string; dialect: string; tableSchema: TableSchema; tablePreview: TablePreview };
type Submission = { ok: boolean; message: string; columns?: string[]; rows?: SqlValue[][]; gainedXp?: number; unlockedSlug?: string | null; battle?: { lives: number; state: BattleView["state"]; hint?: string } | null };
type Action = "run" | "test" | "research" | "revive";

function ResultTable({ columns, rows }: { columns: string[]; rows: SqlValue[][] }) {
  return <div className="sql-table-wrap"><table className="sql-table"><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, index) => <td key={index}>{value === null ? <i>NULL</i> : String(value)}</td>)}</tr>)}</tbody></table></div>;
}

export function SqlWorkspace({ mission, initialBattle }: { mission: SqlMission; initialBattle?: BattleView }) {
  const [query, setQuery] = useState(mission.starterSql);
  const [tab, setTab] = useState<"dados" | "estrutura">("estrutura");
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [battle, setBattle] = useState(initialBattle);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState<Action | null>(null);

  async function submit(mode: Action) {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: query, mode }) });
      const result = await response.json() as Submission;
      setSubmission(result);
      if (result.battle && battle) setBattle({ ...battle, ...result.battle });
      if (result.battle?.hint) setHint(result.battle.hint);
    } catch { setSubmission({ ok: false, message: "Não foi possível consultar o banco agora." }); }
    finally { setLoading(null); }
  }

  return <div className="sql-workspace-grid">
    <aside className="briefing-panel sql-briefing"><a href={`/trilhas/${mission.pathSlug}`}>← Voltar à campanha</a><span className="kicker">BATALHA · {mission.dialect.toUpperCase()}</span><h1>{mission.title}</h1><p>{mission.briefing}</p>{battle ? <BattleCard battle={battle} hint={hint ?? undefined} /> : null}<div className="objective"><small>OBJETIVO DO ATAQUE</small><p>{mission.objective}</p></div><div className="rules"><small>BANCO DESCARTÁVEL</small><p>O banco nasce do zero nesta execução e é apagado ao final. Somente um SELECT é permitido.</p></div></aside>
    <section className="database-panel">
      <div className="database-tabs"><button className={tab === "estrutura" ? "active" : ""} onClick={() => setTab("estrutura")}>Estrutura</button><button className={tab === "dados" ? "active" : ""} onClick={() => setTab("dados")}>Dados</button></div>
      {tab === "estrutura" ? <div className="schema-tree">{mission.tableSchema.tables.map((table) => <div key={table.name}><strong>▾ {table.name}</strong>{table.columns.map((column) => <span key={column.name}>{column.primaryKey ? "🔑 " : ""}{column.name} <small>{column.type}</small></span>)}</div>)}</div> : <ResultTable columns={mission.tablePreview.columns} rows={mission.tablePreview.rows} />}
    </section>
    <section className="editor-panel sql-editor"><div className="editor-tabs"><span>● consulta.sql</span><button onClick={() => { setQuery(mission.starterSql); setSubmission(null); }}>↺ Resetar</button></div><div className="editor-surface" data-testid="sql-editor"><Editor height="100%" language="sql" theme="vs-dark" value={query} onChange={(value) => setQuery(value ?? "")} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2 }} /></div></section>
    <section className="sql-result-panel"><div className="console-actions"><span>COMANDOS</span><div>{battle?.state === "defeated" ? <button className="button" disabled={loading !== null} onClick={() => submit("revive")}>{loading === "revive" ? "Recuperando…" : "♥ REVIVER"}</button> : <><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Testando…" : "▷ TESTAR"}</button><button className="button" disabled={loading !== null || battle?.state === "completed"} onClick={() => submit("test")}>{loading === "test" ? "Atacando…" : "⚔ ATACAR"}</button><button className="button button-research" disabled={loading !== null} onClick={() => submit("research")}>{loading === "research" ? "Buscando…" : "⌕ PESQUISAR"}</button></>}</div></div><div className="sql-result-body" aria-live="polite">{!submission ? <p className="console-empty">Teste livremente; apenas ATACAR pode consumir uma vida.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.columns && submission.rows ? <ResultTable columns={submission.columns} rows={submission.rows} /> : null}{submission.gainedXp ? <div className="reward-banner"><span>INIMIGO DERROTADO</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima batalha →</a> : submission.ok ? <a className="next-mission" href={`/trilhas/${mission.pathSlug}`}>Voltar à campanha →</a> : null}</>}</div></section>
  </div>;
}
