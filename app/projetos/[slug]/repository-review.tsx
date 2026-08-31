"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Review = { repositoryUrl: string; branch: string; latestCommitSha: string | null; reviewStatus: "linked" | "passed" | "needs_changes" | "error"; passedTests: number; failedTests: number; reviewedAt: string | null };
type Result = { ok: boolean; message: string; repositoryUrl?: string; branch?: string; commitSha?: string; results?: { name: string; passed: boolean }[]; nextStepSlug?: string | null };

export function RepositoryReview({ projectSlug, initial }: { projectSlug: string; initial: Review | null }) {
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState(initial?.repositoryUrl ?? "");
  const [branch, setBranch] = useState(initial?.branch ?? "");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function review(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setResult(null);
    try {
      const response = await fetch(`/api/projects/${projectSlug}/repository`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ repositoryUrl, branch }) });
      const value = await response.json() as Result;
      setResult(value);
      if (value.repositoryUrl) setRepositoryUrl(value.repositoryUrl);
      if (value.branch) setBranch(value.branch);
    } catch { setResult({ ok: false, message: "Não foi possível consultar o GitHub agora." }); }
    finally { setLoading(false); }
  }

  const commit = result?.commitSha ?? initial?.latestCommitSha;
  return <details className="project-repository" open={initial?.reviewStatus === "needs_changes" || initial?.reviewStatus === "error"}>
    <summary><span>⌁ ENTREGA PELO GITHUB</span><small>{result ? (result.ok ? "APROVADA" : "VERIFICAR") : initial ? initial.reviewStatus.replace("_", " ").toUpperCase() : "VS CODE → GITHUB"}</small></summary>
    <form onSubmit={review}>
      <label>Repositório público<input required type="url" placeholder="https://github.com/usuario/projeto" value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} /></label>
      <label>Branch<input placeholder="main (automática)" value={branch} onChange={(event) => setBranch(event.target.value)} /></label>
      <button className="button" disabled={loading}>{loading ? "Revisando commit…" : "Revisar último commit"}</button>
    </form>
    <p>O DevDex lê somente os três arquivos exigidos, valida no backend e guarda apenas o endereço, o commit e o resultado.</p>
    {commit ? <small className="repository-commit">COMMIT {commit.slice(0, 8)} · {branch || "branch padrão"}</small> : null}
    {result ? <div className={result.ok ? "repository-result passed" : "repository-result"}><strong>{result.message}</strong>{result.results?.map((item) => <span key={item.name}>{item.passed ? "✓" : "○"} {item.name}</span>)}{result.ok && result.nextStepSlug ? <button type="button" onClick={() => router.refresh()}>Avançar para a próxima etapa →</button> : null}</div> : null}
  </details>;
}
