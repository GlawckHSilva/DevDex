import { getChatGPTUser } from "@/app/chatgpt-auth";
import { executeJavaScript } from "@/lib/quickjs-runner";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: string } | null;
  const code = body?.code?.trim() ?? "";
  if (code.length > 4000) return Response.json({ ok: false, message: "O código ultrapassa o limite desta transmissão." });
  try {
    const wrapped = `function __devdex_tutorial(){ const __output=[]; const console={log:(...args)=>__output.push(args.join(" "))}; ${code}; return __output.join("\\n"); }`;
    const results = await executeJavaScript(wrapped, "__devdex_tutorial", [{ name: "saída do console", input: [], expected: "Olá, DevDex!" }]);
    return Response.json(results[0]?.passed ? { ok: true, output: "Olá, DevDex!" } : { ok: false, message: "Execute console.log com a mensagem exata para concluir a transmissão." });
  } catch { return Response.json({ ok: false, message: "O código não pôde ser executado. Revise a sintaxe e tente outra vez." }); }
}
