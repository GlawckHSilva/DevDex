import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getMission, getMissionTests, recordAttempt } from "@/db";
import { getRecentSubmissionCount, recordSubmission, type SubmissionStatus } from "@/db/runner";
import { executeJavaScript } from "@/lib/quickjs-runner";

type Payload = { code?: string; mode?: "run" | "test" };
const MAX_CODE_LENGTH = 12_000;
const RATE_LIMIT = 20;

async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  const { slug } = await params;
  await ensureUser(user);
  const mission = await getMission(user.userId, slug);
  if (!mission) return Response.json({ ok: false, message: "Missão não encontrada." }, { status: 404 });
  if (mission.state === "locked") return Response.json({ ok: false, message: "Conclua a missão anterior." }, { status: 403 });

  let payload: Payload;
  try { payload = await request.json() as Payload; } catch { return Response.json({ ok: false, message: "Envio inválido." }, { status: 400 }); }
  if (typeof payload.code !== "string" || (payload.mode !== "run" && payload.mode !== "test")) return Response.json({ ok: false, message: "Código e modo são obrigatórios." }, { status: 400 });
  if (payload.code.length > MAX_CODE_LENGTH) return Response.json({ ok: false, message: "O código excede 12.000 caracteres." }, { status: 413 });
  if (await getRecentSubmissionCount(user.userId) >= RATE_LIMIT) {
    return Response.json({ ok: false, message: "Muitas execuções. Tente novamente em alguns minutos." }, { status: 429, headers: { "Retry-After": "300" } });
  }

  const startedAt = Date.now();
  const codeHash = await hashCode(payload.code);
  let status: SubmissionStatus = "error";
  let passedTests = 0;
  let failedTests = 0;
  let errorType: string | null = null;
  try {
    if (payload.mode === "run") {
      await executeJavaScript(payload.code, mission.functionName);
      status = "passed";
      return Response.json({ ok: true, compiled: true, message: "Código validado no ambiente isolado." });
    }

    const tests = await getMissionTests(mission.id);
    const results = await executeJavaScript(payload.code, mission.functionName, tests.map((test) => ({
      name: test.name,
      input: JSON.parse(test.inputJson) as unknown[],
      expected: JSON.parse(test.expectedJson) as unknown,
    })));
    const passed = results.every((result) => result.passed);
    passedTests = results.filter((result) => result.passed).length;
    failedTests = results.length - passedTests;
    status = passed ? "passed" : "failed";
    const progress = await recordAttempt(user.userId, mission, passed);
    return Response.json({
      ok: passed,
      message: passed ? "Todos os testes passaram." : "Alguns testes ainda falharam.",
      results: results.map((result, index) => ({ name: `Teste ${index + 1}`, passed: result.passed })),
      ...progress,
    });
  } catch (error) {
    errorType = error instanceof Error ? error.name : "UnknownError";
    if (payload.mode === "test") await recordAttempt(user.userId, mission, false);
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível avaliar o código." }, { status: 422 });
  } finally {
    await recordSubmission({ userId: user.userId, missionId: mission.id, mode: payload.mode, status, codeHash, durationMs: Date.now() - startedAt, passedTests, failedTests, errorType }).catch(console.error);
  }
}
