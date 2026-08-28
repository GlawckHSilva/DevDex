import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, ensureUser, getBattle, getMission, getMissionTests, getRecentBattleEventCount, getSqlMissionConfig, getWebMissionConfig, recordAttempt, recordBattleAction, researchBattle, reviveBattle } from "@/db";
import { getRecentSubmissionCount, recordSubmission, type SubmissionStatus } from "@/db/runner";
import { JavaScriptRunnerAdapter } from "@/lib/runners/javascript-adapter";
import { SqlRunnerAdapter, type SqlExpectedResult } from "@/lib/runners/sql-adapter";
import { WebRunnerAdapter, type WebValidationRule } from "@/lib/runners/web-adapter";
import { z } from "zod";

const MAX_CODE_LENGTH = 12_000;
const RATE_LIMIT = 20;
const PayloadSchema = z.object({ code: z.string().optional(), mode: z.enum(["run", "test", "research", "revive"]).optional() });
type Payload = z.infer<typeof PayloadSchema>;

async function hashCode(code: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  const { slug } = await params;
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const mission = await getMission(user.userId, slug);
  if (!mission) return Response.json({ ok: false, message: "Missão não encontrada." }, { status: 404 });
  if (mission.state === "locked") return Response.json({ ok: false, message: "Conclua a missão anterior." }, { status: 403 });

  const battle = await getBattle(user.userId, mission.id, mission.state === "completed");
  let payload: Payload;
  try {
    const parsed = PayloadSchema.safeParse(await request.json());
    if (!parsed.success) return Response.json({ ok: false, message: "Envio inválido." }, { status: 400 });
    payload = parsed.data;
  } catch { return Response.json({ ok: false, message: "Envio inválido." }, { status: 400 }); }
  if ((payload.mode === "research" || payload.mode === "revive") && await getRecentBattleEventCount(user.userId) >= 40) return Response.json({ ok: false, message: "Muitas ações. Tente novamente em alguns minutos." }, { status: 429 });
  if (payload.mode === "research") {
    if (!battle) return Response.json({ ok: false, message: "Esta missão não possui batalha." }, { status: 400 });
    return Response.json({ ok: true, message: "Conhecimento encontrado.", battle: await researchBattle(user.userId, battle) });
  }
  if (payload.mode === "revive") {
    if (!battle) return Response.json({ ok: false, message: "Esta missão não possui batalha." }, { status: 400 });
    return Response.json({ ok: true, message: "Você voltou à batalha com três vidas.", battle: await reviveBattle(user.userId, mission.id) });
  }
  if (typeof payload.code !== "string" || (payload.mode !== "run" && payload.mode !== "test")) return Response.json({ ok: false, message: "Código e modo são obrigatórios." }, { status: 400 });
  if (payload.mode === "test" && battle?.state === "defeated") return Response.json({ ok: false, message: "Você foi derrotado. Recupere suas vidas para atacar novamente.", battle }, { status: 409 });
  if (payload.code.length > MAX_CODE_LENGTH) return Response.json({ ok: false, message: "O código excede 12.000 caracteres." }, { status: 413 });
  if (await getRecentSubmissionCount(user.userId) >= RATE_LIMIT) {
    return Response.json({ ok: false, message: "Muitas execuções. Tente novamente em alguns minutos." }, { status: 429, headers: { "Retry-After": "300" } });
  }

  const startedAt = Date.now();
  const codeHash = await hashCode(payload.code);
  let status: SubmissionStatus = "error";
  let passedTests = 0;
  let failedTests = 0;
  let resultRows = 0;
  let errorType: string | null = null;
  try {
    if (mission.runtime === "html" || mission.runtime === "css") {
      const config = await getWebMissionConfig(mission.id);
      if (!config) throw new Error("Configuração do preview indisponível.");
      const result = await WebRunnerAdapter.execute({
        code: payload.code,
        documentType: config.documentType,
        rules: JSON.parse(config.validatorJson) as WebValidationRule[],
        maxLength: config.maxLength,
      });
      const passed = result.passed;
      passedTests = result.results.filter((item) => item.passed).length;
      failedTests = result.results.length - passedTests;
      const battleOutcome = passed ? "passed" : passedTests > 0 ? "progress" : "failed";
      status = passed ? "passed" : "failed";
      if (payload.mode === "run") return Response.json({ ok: true, message: passed ? "Código seguro; todos os critérios foram atendidos." : "Código seguro; alguns critérios ainda precisam de atenção.", results: result.results.map((item, index) => ({ name: `Critério ${index + 1}`, passed: item.passed })), battle: battle ? await recordBattleAction(user.userId, mission.id, "test", battleOutcome) : undefined });
      const progress = await recordAttempt(user.userId, mission, passed);
      const battleState = battle ? await recordBattleAction(user.userId, mission.id, "attack", battleOutcome) : null;
      return Response.json({
        ok: passed,
        message: passed ? "Todos os critérios visuais foram atendidos." : passedTests > 0 ? "Objetivo atingido; continue com os critérios restantes." : "O preview ainda não atende aos critérios.",
        results: result.results.map((item, index) => ({ name: `Critério ${index + 1}`, passed: item.passed })),
        battle: battleState,
        ...progress,
      });
    }

    if (mission.runtime === "sqlite") {
      const config = await getSqlMissionConfig(mission.id);
      if (!config) throw new Error("Configuração SQL indisponível.");
      const result = await SqlRunnerAdapter.execute({
        query: payload.code,
        schemaSql: config.schemaSql,
        seedSql: config.seedSql,
        expected: JSON.parse(config.expectedResultJson) as SqlExpectedResult,
        maxRows: config.maxRows,
        timeoutMs: config.timeoutMs,
        maxStatements: config.maxStatements,
      });
      resultRows = result.rows.length;
      const passed = result.passed === true;
      status = passed ? "passed" : "failed";
      if (payload.mode === "run") return Response.json({ ok: true, message: `${resultRows} linha(s) retornada(s).`, columns: result.columns, rows: result.rows, results: [{ name: "Resultado esperado", passed }], dialect: config.dialect, battle: battle ? await recordBattleAction(user.userId, mission.id, "test", passed ? "passed" : "failed") : undefined });
      passedTests = passed ? 1 : 0;
      failedTests = passed ? 0 : 1;
      const progress = await recordAttempt(user.userId, mission, passed);
      const battleState = battle ? await recordBattleAction(user.userId, mission.id, "attack", passed ? "passed" : "failed") : null;
      return Response.json({
        ok: passed,
        message: passed ? "Resultado correto." : "A consulta executou, mas o resultado ainda não corresponde ao objetivo.",
        columns: result.columns,
        rows: result.rows,
        results: [{ name: "Resultado esperado", passed }],
        dialect: config.dialect,
        battle: battleState,
        ...progress,
      });
    }

    const tests = await getMissionTests(mission.id);
    const results = await JavaScriptRunnerAdapter.execute({ code: payload.code, functionName: mission.functionName, tests: tests.map((test) => ({
      name: test.name,
      input: JSON.parse(test.inputJson) as unknown[],
      expected: JSON.parse(test.expectedJson) as unknown,
    })) });
    const passed = results.every((result) => result.passed);
    passedTests = results.filter((result) => result.passed).length;
    failedTests = results.length - passedTests;
    const battleOutcome = passed ? "passed" : passedTests > 0 ? "progress" : "failed";
    status = passed ? "passed" : "failed";
    if (payload.mode === "run") return Response.json({ ok: true, compiled: true, message: passed ? "Código seguro; todos os testes passaram." : "Código seguro; alguns testes ainda falharam.", results: results.map((result, index) => ({ name: `Teste ${index + 1}`, passed: result.passed })), battle: battle ? await recordBattleAction(user.userId, mission.id, "test", battleOutcome) : undefined });
    const progress = await recordAttempt(user.userId, mission, passed);
    const battleState = battle ? await recordBattleAction(user.userId, mission.id, "attack", battleOutcome) : null;
    return Response.json({
      ok: passed,
      message: passed ? "Todos os testes passaram." : passedTests > 0 ? "Objetivo atingido; continue com os testes restantes." : "Alguns testes ainda falharam.",
      results: results.map((result, index) => ({ name: `Teste ${index + 1}`, passed: result.passed })),
      battle: battleState,
      ...progress,
    });
  } catch (error) {
    errorType = error instanceof Error ? error.name : "UnknownError";
    console.error(JSON.stringify({ event: "runner_error", runtime: mission.runtime, mission: mission.slug, errorType }));
    if (payload.mode === "test") await recordAttempt(user.userId, mission, false);
    const battleState = battle ? await recordBattleAction(user.userId, mission.id, payload.mode === "test" ? "attack" : "test", "error") : null;
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível avaliar o código.", battle: battleState }, { status: 422 });
  } finally {
    await recordSubmission({ userId: user.userId, missionId: mission.id, mode: payload.mode, status, codeHash, runtime: mission.runtime, runnerVersion: mission.runnerVersion, durationMs: Date.now() - startedAt, passedTests, failedTests, resultRows, errorType }).catch(console.error);
  }
}
