"use client";

import Editor, { loader } from "@monaco-editor/react";
import { useState } from "react";

loader.config({ paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" } });

type MissionView = { slug: string; title: string; briefing: string; objective: string; starterCode: string; functionName: string; completed: boolean; nextMissionSlug: string | null };
type Submission = { ok: boolean; compiled?: boolean; message: string; results?: { name: string; passed: boolean }[]; gainedXp?: number; totalXp?: number; unlockedSlug?: string | null };

export function MissionWorkspace({ mission }: { mission: MissionView }) {
  const [code, setCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<"run" | "test" | null>(null);

  async function submit(mode: "run" | "test") {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, mode }) });
      setSubmission(await response.json() as Submission);
    } catch { setSubmission({ ok: false, message: "Não foi possível avaliar agora. Tente novamente." }); }
    finally { setLoading(null); }
  }

  return <div className="workspace-grid">
    <aside className="briefing-panel"><a href="/trilhas/javascript-fundamentals">← Voltar à trilha</a><span className="kicker">BRIEFING</span><h1>{mission.title}</h1><p>{mission.briefing}</p><div className="objective"><small>OBJETIVO</small><p>{mission.objective}</p></div><div className="rules"><small>AMBIENTE SEGURO</small><p>Seu JavaScript roda em uma sandbox QuickJS isolada, com limites de tempo e memória e sem acesso à rede ou ao sistema.</p></div></aside>
    <section className="editor-panel">
      <div className="editor-tabs"><span>● {mission.functionName}.js</span><button type="button" onClick={() => { setCode(mission.starterCode); setSubmission(null); }}>↺ Resetar</button></div>
      <div data-testid="code-editor" className="editor-surface"><Editor height="100%" language="javascript" theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, fontFamily: "var(--font-geist-mono)", minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2, wordWrap: "on" }} /></div>
    </section>
    <section className="console-panel">
      <div className="console-actions"><span>CONSOLE & TESTES</span><div><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Executando…" : "▷ Executar"}</button><button className="button" disabled={loading !== null} onClick={() => submit("test")}>{loading === "test" ? "Testando…" : "✓ Testar missão"}</button></div></div>
      <div className="console-output" aria-live="polite">{!submission ? <p className="console-empty">Execute o código ou rode os testes privados.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.results?.map((result) => <p key={result.name}><b>{result.passed ? "✓" : "×"}</b> {result.name}</p>)}{submission.gainedXp ? <div className="reward-banner"><span>MISSÃO CONCLUÍDA</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima missão →</a> : submission.ok ? <a className="next-mission" href="/dashboard">Voltar ao dashboard →</a> : null}</>}</div>
    </section>
  </div>;
}
