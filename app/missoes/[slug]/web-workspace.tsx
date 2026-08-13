"use client";

import Editor from "@monaco-editor/react";
import { useMemo, useState } from "react";

type WebMission = { slug: string; title: string; briefing: string; objective: string; starterCode: string; completed: boolean; nextMissionSlug: string | null; documentType: "html" | "css"; previewHtml: string; previewCss: string };
type Submission = { ok: boolean; message: string; results?: { name: string; passed: boolean }[]; gainedXp?: number; unlockedSlug?: string | null };
const CSP = "default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none'; navigate-to 'none'";

function previewDocument(mission: WebMission, code: string) {
  const html = mission.documentType === "html" ? code : mission.previewHtml;
  const css = mission.documentType === "css" ? code : mission.previewCss;
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>${css}</style></head><body>${html}</body></html>`;
}

export function WebWorkspace({ mission }: { mission: WebMission }) {
  const [code, setCode] = useState(mission.starterCode);
  const [previewCode, setPreviewCode] = useState(mission.starterCode);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<"run" | "test" | null>(null);
  const srcDoc = useMemo(() => previewDocument(mission, previewCode), [mission, previewCode]);

  async function submit(mode: "run" | "test") {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/missions/${mission.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code, mode }) });
      const result = await response.json() as Submission;
      setSubmission(result);
      if (response.ok) setPreviewCode(code);
    } catch { setSubmission({ ok: false, message: "Não foi possível validar o preview agora." }); }
    finally { setLoading(null); }
  }

  const path = mission.documentType === "html" ? "html-fundamentals" : "css-fundamentals";
  return <div className="web-workspace-grid">
    <aside className="briefing-panel web-briefing"><a href={`/trilhas/${path}`}>← Voltar à trilha</a><span className="kicker">MISSÃO · {mission.documentType.toUpperCase()}</span><h1>{mission.title}</h1><p>{mission.briefing}</p><div className="objective"><small>OBJETIVO</small><p>{mission.objective}</p></div><div className="rules"><small>PREVIEW ISOLADO</small><p>Scripts, rede, navegação e acesso à aplicação permanecem bloqueados.</p></div></aside>
    <section className="editor-panel web-editor"><div className="editor-tabs"><span>● index.{mission.documentType}</span><button onClick={() => { setCode(mission.starterCode); setPreviewCode(mission.starterCode); setSubmission(null); }}>↺ Resetar</button></div><div className="editor-surface" data-testid="web-editor"><Editor height="100%" language={mission.documentType} theme="vs-dark" value={code} onChange={(value) => setCode(value ?? "")} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2 }} /></div></section>
    <section className="preview-panel"><div className="preview-bar"><span>PREVIEW</span><small>IFRAME ISOLADO</small></div><iframe title="Preview da missão" sandbox="" referrerPolicy="no-referrer" srcDoc={srcDoc} /></section>
    <section className="web-result-panel"><div className="console-actions"><span>VALIDAÇÃO</span><div><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Renderizando…" : "▷ Executar"}</button><button className="button" disabled={loading !== null} onClick={() => submit("test")}>{loading === "test" ? "Validando…" : "✓ Validar missão"}</button></div></div><div className="console-output" aria-live="polite">{!submission ? <p className="console-empty">Execute o código para atualizar o preview.</p> : <><p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p>{submission.results?.map((result) => <p key={result.name}>{result.passed ? "✓" : "×"} {result.name}</p>)}{submission.gainedXp ? <div className="reward-banner"><span>MISSÃO CONCLUÍDA</span><strong>+{submission.gainedXp} XP</strong></div> : null}{submission.ok && submission.unlockedSlug ? <a className="next-mission" href={`/missoes/${submission.unlockedSlug}`}>Próxima missão →</a> : submission.ok ? <a className="next-mission" href="/dashboard">Voltar ao dashboard →</a> : null}</>}</div></section>
  </div>;
}
