"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MentorReview = { summary: string; strengths: string[]; improvements: string[]; nextStep: string };
type Review = { repositoryUrl: string; branch: string; latestCommitSha: string | null; reviewStatus: "linked" | "passed" | "needs_changes" | "error"; passedTests: number; failedTests: number; reviewedAt: string | null; aiStatus: "unavailable" | "completed" | "error"; aiSummary: string | null; aiStrengths: string[]; aiImprovements: string[]; aiNextStep: string | null };
type Result = { ok: boolean; message: string; repositoryUrl?: string; branch?: string; commitSha?: string; results?: { name: string; passed: boolean }[]; nextStepSlug?: string | null; aiStatus?: Review["aiStatus"]; aiReview?: MentorReview | null };

export function RepositoryReview({ projectSlug, initial, githubConnected, githubAppEnabled, aiEnabled }: { projectSlug: string; initial: Review | null; githubConnected: boolean; githubAppEnabled: boolean; aiEnabled: boolean }) {
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState(initial?.repositoryUrl ?? "");
  const [branch, setBranch] = useState(initial?.branch ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiReview, setAiReview] = useState(aiEnabled);
  const privateConnected = githubAppEnabled && githubConnected;

  async function review(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setResult(null);
    try {
      const response = await fetch(`/api/projects/${projectSlug}/repository`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repositoryUrl, branch, aiReview }) });
      const value = await response.json() as Result;
      setResult(value);
      if (value.repositoryUrl) setRepositoryUrl(value.repositoryUrl);
      if (value.branch) setBranch(value.branch);
    } catch { setResult({ ok: false, message: "Não foi possível consultar o GitHub agora." }); }
    finally { setLoading(false); }
  }

  const commit = result?.commitSha ?? initial?.latestCommitSha;
  const mentor = result?.aiReview ?? (initial?.aiStatus === "completed" && initial.aiSummary && initial.aiNextStep ? { summary: initial.aiSummary, strengths: initial.aiStrengths, improvements: initial.aiImprovements, nextStep: initial.aiNextStep } : null);
  return <details className="project-repository" open={initial?.reviewStatus === "needs_changes" || initial?.reviewStatus === "error"}>
    <summary><span>⌁ ENTREGA PELO GITHUB</span><small>{result ? (result.ok ? "APROVADA" : "VERIFICAR") : initial ? initial.reviewStatus.replace("_", " ").toUpperCase() : "VS CODE → GITHUB"}</small></summary>
    <form onSubmit={review}>
      <label>{privateConnected ? "Repositório público ou privado" : "Repositório público"}<input required type="url" placeholder="https://github.com/usuario/projeto" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} /></label>
      <label>Branch<input placeholder="main (automática)" value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
      <button className="button" disabled={loading}>{loading ? "Revisando commit…" : "Revisar último commit"}</button>
    </form>
    <div className="repository-options">{aiEnabled ? <label><input type="checkbox" checked={aiReview} onChange={(event) => setAiReview(event.target.checked)} /> Receber feedback do Mentor IA — os arquivos serão enviados à OpenAI nesta revisão.</label> : <span>Mentor IA aguardando configuração segura da chave.</span>}{githubAppEnabled ? <a href={`/github/connect?return_to=/projetos/${projectSlug}`} target="_top">{privateConnected ? "✓ GitHub conectado" : "Conectar GitHub para repositórios privados"}</a> : <span>Repositórios privados aguardando configuração da GitHub App.</span>}</div>
    <p>O DevDex valida no backend e guarda apenas o endereço, o commit, os resultados e o feedback — nunca o código.</p>
    {commit ? <small className="repository-commit">COMMIT {commit.slice(0, 8)} · {branch || "branch padrão"}</small> : null}
    {result ? <div className={result.ok ? "repository-result passed" : "repository-result"}><strong>{result.message}</strong>{result.results?.map((item) => <span key={item.name}>{item.passed ? "✓" : "○"} {item.name}</span>)}{result.ok && result.nextStepSlug ? <button type="button" onClick={() => router.refresh()}>Avançar para a próxima etapa →</button> : null}</div> : null}
    {mentor ? <div className="mentor-review"><strong>✦ MENTOR IA</strong><p>{mentor.summary}</p>{mentor.strengths.map((item) => <span key={item}>✓ {item}</span>)}{mentor.improvements.map((item) => <span key={item}>→ {item}</span>)}<b>Próximo passo: {mentor.nextStep}</b></div> : result?.aiStatus === "error" ? <small className="mentor-unavailable">O Mentor IA ficou indisponível, mas os testes objetivos foram concluídos normalmente.</small> : null}
  </details>;
}
