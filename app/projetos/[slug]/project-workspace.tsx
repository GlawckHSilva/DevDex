"use client";

import Editor from "@monaco-editor/react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RepositoryReview } from "./repository-review";

type Path = "index.html" | "style.css" | "script.js";
type FileItem = { path: Path; language: "html" | "css" | "javascript"; starterCode: string };
type Step = { slug: string; title: string; briefing: string; objective: string; activeFile: Path; requirements: string[]; xpReward: number; state: "locked" | "available" | "in_progress" | "completed" };
type Repository = { repositoryUrl: string; branch: string; latestCommitSha: string | null; reviewStatus: "linked" | "passed" | "needs_changes" | "error"; passedTests: number; failedTests: number; reviewedAt: string | null };
type Project = { slug: string; title: string; description: string; introduction: string; deadlineDays: number; state: "available" | "in_progress" | "completed"; completedSteps: number; files: FileItem[]; steps: Step[]; repository: Repository | null };
type Submission = { ok: boolean; message: string; results?: { name: string; passed: boolean }[]; gainedXp?: number; nextStepSlug?: string | null; projectCompleted?: boolean };
type Sources = Record<Path, string>;

const CSP = "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none'; base-uri 'none'; navigate-to 'none'";
const MEMORY_STORAGE = `const __memory={};const localStorage={getItem:k=>Object.hasOwn(__memory,k)?__memory[k]:null,setItem:(k,v)=>__memory[k]=String(v),removeItem:k=>delete __memory[k],clear:()=>Object.keys(__memory).forEach(k=>delete __memory[k])};`;

function makePreview(files: Sources) {
  const css = files["style.css"].replace(/<\/style/gi, "<\\/style");
  const js = files["script.js"].replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${CSP}"><style>${css}</style></head><body>${files["index.html"]}<script>${MEMORY_STORAGE}\n${js}</script></body></html>`;
}

export function ProjectWorkspace({ project, backHref = "/dashboard" }: { project: Project; backHref?: string }) {
  const router = useRouter();
  const starter = useMemo(() => Object.fromEntries(project.files.map((file) => [file.path, file.starterCode])) as Sources, [project.files]);
  const currentStep = project.steps.find((step) => step.state === "available" || step.state === "in_progress") ?? project.steps.at(-1)!;
  const [files, setFiles] = useState<Sources>(starter);
  const [previewFiles, setPreviewFiles] = useState<Sources>(starter);
  const [activePath, setActivePath] = useState<Path>(currentStep.activeFile);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<"run" | "test" | null>(null);
  const storageKey = `devdex:project:${project.slug}:files:v1`;
  const activeFile = project.files.find((file) => file.path === activePath)!;

  useEffect(() => {
    const timer = window.setTimeout(() => { try {
      const saved = localStorage.getItem(storageKey);
      if (saved) { const restored = { ...starter, ...JSON.parse(saved) } as Sources; setFiles(restored); setPreviewFiles(restored); }
    } catch { /* armazenamento local indisponível */ } }, 0);
    return () => window.clearTimeout(timer);
  }, [starter, storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => { try { localStorage.setItem(storageKey, JSON.stringify(files)); } catch { /* armazenamento local indisponível */ } }, 350);
    return () => window.clearTimeout(timer);
  }, [files, storageKey]);

  async function submit(mode: "run" | "test") {
    setLoading(mode); setSubmission(null);
    try {
      const response = await fetch(`/api/projects/${project.slug}/submit`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ files, mode }) });
      const result = await response.json() as Submission;
      setSubmission(result);
      if (response.ok) setPreviewFiles(files);
    } catch { setSubmission({ ok: false, message: "Não foi possível validar o projeto agora." }); }
    finally { setLoading(null); }
  }

  const preview = useMemo(() => makePreview(previewFiles), [previewFiles]);
  return <div className="project-workspace-grid">
    <aside className="project-explorer">
      <a href={backHref}>← {backHref === "/dashboard" ? "Dashboard" : "Campanha"}</a><span className="kicker">ARQUIVOS</span>
      <div className="project-files">{project.files.map((file) => <button className={activePath === file.path ? "active" : ""} key={file.path} onClick={() => setActivePath(file.path)}><span>{file.language === "html" ? "◇" : file.language === "css" ? "#" : "JS"}</span>{file.path}</button>)}</div>
      <span className="kicker project-steps-label">ETAPAS</span><ol className="project-steps">{project.steps.map((step, index) => <li className={`state-${step.state}`} key={step.slug}><span>{step.state === "completed" ? "✓" : index + 1}</span><small>{step.title}</small></li>)}</ol>
      <small className="autosave-state">● Autosave neste navegador</small>
    </aside>
    <section className="project-briefing"><div><span className="kicker">ETAPA {currentStep.slug.split("-")[0]}</span><h1>{currentStep.title}</h1><p>{currentStep.briefing}</p></div><div className="objective"><small>CONTEXTO · PRAZO SUGERIDO: {project.deadlineDays} DIAS</small><p>{project.introduction}</p><small>OBJETIVO ATUAL</small><p>{currentStep.objective}</p></div></section>
    <section className="editor-panel project-editor"><div className="editor-tabs"><span>● {activePath}</span><button onClick={() => { setFiles(starter); setPreviewFiles(starter); setSubmission(null); }}>↺ Restaurar base</button></div><div className="editor-surface" data-testid="project-editor"><Editor height="100%" language={activeFile.language} theme="vs-dark" value={files[activePath]} onChange={(value) => setFiles((current) => ({ ...current, [activePath]: value ?? "" }))} options={{ automaticLayout: true, fontSize: 14, minimap: { enabled: false }, padding: { top: 18 }, scrollBeyondLastLine: false, tabSize: 2 }} /></div></section>
    <section className="preview-panel project-preview"><div className="preview-bar"><span>PREVIEW</span><small>SANDBOX ISOLADO</small></div><iframe title="Preview do projeto" sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={preview} /></section>
      <section className="project-tests"><div className="console-actions"><span>REQUISITOS · {currentStep.xpReward} XP</span><div><button className="button button-ghost" disabled={loading !== null} onClick={() => submit("run")}>{loading === "run" ? "Executando…" : "▷ Executar"}</button><button className="button" disabled={loading !== null || project.state === "completed"} onClick={() => submit("test")}>{loading === "test" ? "Validando…" : "✓ Validar etapa"}</button></div></div><RepositoryReview projectSlug={project.slug} initial={project.repository} /><div className="project-test-body" aria-live="polite">{submission?.projectCompleted ? <div className="project-complete"><span>🏆 PROJETO CONCLUÍDO</span><strong>{project.title}</strong><a href="/dashboard">Ver no dashboard →</a></div> : <>{(submission?.results ?? currentStep.requirements.map((name) => ({ name, passed: false }))).map((result) => <p className={result.passed ? "passed" : ""} key={result.name}>{result.passed ? "✓" : "○"} {result.name}</p>)}{submission ? <p className={submission.ok ? "console-success" : "console-error"}>{submission.message}</p> : null}{submission?.ok && submission.nextStepSlug ? <button className="next-step" onClick={() => router.refresh()}>Avançar para a próxima etapa →</button> : null}</>}</div></section>
  </div>;
}
