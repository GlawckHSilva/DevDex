import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getMission, getMissionTests, recordAttempt } from "@/db";
import { compileSafeFunction } from "@/lib/safe-js-evaluator";

type Payload = { code?: string; mode?: "run" | "test" };
type TestValue = number | boolean;

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

  try {
    const parameters = JSON.parse(mission.parametersJson) as string[];
    const execute = compileSafeFunction(payload.code, mission.functionName, parameters);
    if (payload.mode === "run") return Response.json({ ok: true, compiled: true, message: "Código validado no ambiente seguro." });

    const tests = await getMissionTests(mission.id);
    const results = tests.map((test) => {
      const input = JSON.parse(test.inputJson) as TestValue[];
      const expected = JSON.parse(test.expectedJson) as TestValue;
      return { name: test.name, passed: Object.is(execute(...input), expected) };
    });
    const passed = results.every((result) => result.passed);
    const progress = await recordAttempt(user.userId, mission, passed);
    return Response.json({ ok: passed, message: passed ? "Todos os testes passaram." : "Alguns testes ainda falharam.", results, ...progress });
  } catch (error) {
    await recordAttempt(user.userId, mission, false);
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Não foi possível avaliar o código." }, { status: 422 });
  }
}
