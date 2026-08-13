import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getProject, getRecentProjectSubmissionCount, recordProjectAttempt, recordProjectSubmission } from "@/db";
import { ProjectRunnerAdapter, type ProjectFiles, type ProjectValidator } from "@/lib/runners/project-adapter";

type Payload = { files?: Partial<ProjectFiles>; mode?: "run" | "test" };
const FILES: (keyof ProjectFiles)[] = ["index.html", "style.css", "script.js"];

async function hashFiles(files: ProjectFiles) {
  const source = FILES.map((path) => `${path}\0${files[path]}`).join("\0");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(source));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  await ensureUser(user);
  const project = await getProject(user.userId, (await params).slug);
  if (!project) return Response.json({ ok: false, message: "Projeto não encontrado." }, { status: 404 });
  const step = project.steps.find((item) => item.state === "available" || item.state === "in_progress");
  if (!step) return Response.json({ ok: true, message: "Projeto já concluído.", projectCompleted: true });

  let payload: Payload;
  try { payload = await request.json() as Payload; } catch { return Response.json({ ok: false, message: "Envio inválido." }, { status: 400 }); }
  if ((payload.mode !== "run" && payload.mode !== "test") || !payload.files || FILES.some((path) => typeof payload.files?.[path] !== "string")) {
    return Response.json({ ok: false, message: "Os três arquivos e o modo são obrigatórios." }, { status: 400 });
  }
  if (await getRecentProjectSubmissionCount(user.userId) >= 25) return Response.json({ ok: false, message: "Muitas validações. Tente novamente em alguns minutos." }, { status: 429, headers: { "Retry-After": "300" } });

  const files = payload.files as ProjectFiles;
  const startedAt = Date.now();
  const sourceHash = await hashFiles(files);
  let status: "passed" | "failed" | "error" = "error";
  let passedTests = 0;
  let failedTests = 0;
  let errorType: string | null = null;
  try {
    const validator = payload.mode === "test" ? JSON.parse(step.validatorJson) as ProjectValidator : undefined;
    const result = await ProjectRunnerAdapter.execute({ files, validator });
    const passed = payload.mode === "run" || result.passed;
    status = passed ? "passed" : "failed";
    if (payload.mode === "run") return Response.json({ ok: true, message: "Arquivos seguros para o preview isolado." });
    passedTests = result.results.filter((item) => item.passed).length;
    failedTests = result.results.length - passedTests;
    const progress = await recordProjectAttempt(user.userId, project, step, passed);
    const requirements = JSON.parse(step.requirementsJson) as string[];
    return Response.json({
      ok: passed,
      message: passed ? "Etapa concluída." : "Alguns requisitos ainda precisam de atenção.",
      results: requirements.map((name, index) => ({ name, passed: result.results[index]?.passed === true })),
      projectCompleted: progress.projectState === "completed",
      ...progress,
    });
  } catch (error) {
    errorType = error instanceof Error ? error.name : "UnknownError";
    if (payload.mode === "test") await recordProjectAttempt(user.userId, project, step, false);
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível validar o projeto." }, { status: 422 });
  } finally {
    await recordProjectSubmission({ userId: user.userId, projectId: project.id, stepId: step.id, status, sourceHash, durationMs: Date.now() - startedAt, passedTests, failedTests, errorType }).catch(console.error);
  }
}
