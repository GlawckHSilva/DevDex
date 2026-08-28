import { env } from "cloudflare:workers";

type PythonTest = { name: string; input: unknown[]; expected: unknown };
type PythonResult = { name: string; passed: boolean };

export const PythonRunnerAdapter = {
  async execute(input: { code: string; functionName: string; tests: PythonTest[] }): Promise<PythonResult[]> {
    const config = env as { PYTHON_RUNNER_URL?: string; PYTHON_RUNNER_SECRET?: string };
    if (!config.PYTHON_RUNNER_URL || !config.PYTHON_RUNNER_SECRET) throw new Error("Runner Python indisponível.");
    const response = await fetch(config.PYTHON_RUNNER_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${config.PYTHON_RUNNER_SECRET}`, "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(8_000),
    });
    const payload = await response.json() as { ok?: boolean; message?: string; results?: PythonResult[] };
    if (!response.ok || !payload.ok || !Array.isArray(payload.results)) throw new Error(payload.message || "Não foi possível executar o código Python.");
    return payload.results;
  },
};
