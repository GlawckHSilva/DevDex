import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, ensureUser, getGitHubInstallation, getProject, getRecentProjectSubmissionCount, recordProjectAttempt, recordProjectSubmission, saveProjectRepository } from "@/db";
import { reviewProjectWithAI } from "@/lib/ai-project-review";
import { createInstallationToken } from "@/lib/github-app";
import { fetchProject, parseGitHubRepository } from "@/lib/github-project";
import { ProjectRunnerAdapter, type ProjectValidator } from "@/lib/runners/project-adapter";
import { z } from "zod";

const payloadSchema = z.object({ repositoryUrl: z.string().trim().max(240), branch: z.string().trim().max(100).optional().default(""), aiReview: z.boolean().optional().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const project = await getProject(user.userId, (await params).slug);
  if (!project) return Response.json({ ok: false, message: "Projeto não encontrado." }, { status: 404 });
  if (project.state === "locked") return Response.json({ ok: false, message: "Este projeto ainda está bloqueado." }, { status: 403 });
  const step = project.steps.find((item) => item.state === "available" || item.state === "in_progress") ?? project.steps.at(-1);
  if (!step) return Response.json({ ok: false, message: "Projeto sem etapas configuradas." }, { status: 422 });
  if (await getRecentProjectSubmissionCount(user.userId) >= 25) return Response.json({ ok: false, message: "Muitas revisões. Tente novamente em alguns minutos." }, { status: 429, headers: { "Retry-After": "300" } });

  const parsed = payloadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "Informe a URL do repositório e uma branch válida." }, { status: 400 });
  const startedAt = Date.now();
  let repository: ReturnType<typeof parseGitHubRepository> | null = null;
  let commitSha: string | null = null;
  let passedTests = 0;
  let failedTests = 0;
  let status: "passed" | "failed" | "error" = "error";
  let errorType: string | null = null;
  try {
    repository = parseGitHubRepository(parsed.data.repositoryUrl);
    const installation = await getGitHubInstallation(user.userId, repository.owner);
    const githubToken = installation ? await createInstallationToken(installation.installationId) : "";
    const snapshot = await fetchProject(repository.repositoryUrl, parsed.data.branch, githubToken);
    commitSha = snapshot.commitSha;
    const result = await ProjectRunnerAdapter.execute({ files: snapshot.files, validator: JSON.parse(step.validatorJson) as ProjectValidator });
    passedTests = result.results.filter((item) => item.passed).length;
    failedTests = result.results.length - passedTests;
    status = result.passed ? "passed" : "failed";
    const requirements = JSON.parse(step.requirementsJson) as string[];
    const safetyIdentifier = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(user.userId)).then((digest) => [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join(""));
    const ai = parsed.data.aiReview ? await reviewProjectWithAI({ files: snapshot.files, projectTitle: project.title, stepTitle: step.title, requirements, results: result.results, safetyIdentifier }) : { status: "unavailable" as const, review: null };
    const progress = project.state === "completed" ? null : await recordProjectAttempt(user.userId, project, step, result.passed);
    await saveProjectRepository({ userId: user.userId, projectId: project.id, repositoryUrl: snapshot.repositoryUrl, owner: snapshot.owner, repo: snapshot.repo, branch: snapshot.branch, latestCommitSha: snapshot.commitSha, reviewStatus: result.passed ? "passed" : "needs_changes", passedTests, failedTests, aiStatus: ai.status, aiSummary: ai.review?.summary, aiStrengths: ai.review?.strengths, aiImprovements: ai.review?.improvements, aiNextStep: ai.review?.nextStep });
    return Response.json({
      ok: result.passed,
      message: result.passed ? "Commit aprovado pela revisão automática." : "O commit ainda precisa de ajustes.",
      repositoryUrl: snapshot.repositoryUrl, branch: snapshot.branch, commitSha: snapshot.commitSha,
      results: requirements.map((name, index) => ({ name, passed: result.results[index]?.passed === true })),
      aiStatus: ai.status, aiReview: ai.review,
      projectCompleted: progress?.projectState === "completed" || project.state === "completed",
      ...(progress ?? {}),
    });
  } catch (error) {
    errorType = error instanceof Error ? error.name : "UnknownError";
    if (repository) await saveProjectRepository({ userId: user.userId, projectId: project.id, repositoryUrl: repository.repositoryUrl, owner: repository.owner, repo: repository.repo, branch: parsed.data.branch || "main", latestCommitSha: commitSha, reviewStatus: "error", passedTests, failedTests }).catch(console.error);
    console.error(JSON.stringify({ event: "github_project_review_error", project: project.slug, step: step.slug, errorType }));
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível revisar o repositório." }, { status: 422 });
  } finally {
    await recordProjectSubmission({ userId: user.userId, projectId: project.id, stepId: step.id, status, sourceHash: commitSha ?? "github-unavailable", durationMs: Date.now() - startedAt, passedTests, failedTests, errorType }).catch(console.error);
  }
}
