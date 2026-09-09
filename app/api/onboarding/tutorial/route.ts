import { getChatGPTUser } from "@/app/chatgpt-auth";

export async function POST(request: Request) {
  if (!(await getChatGPTUser())) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  const body = await request.json().catch(() => null) as { code?: string } | null;
  const code = body?.code?.trim() ?? "";
  const passed = /console\s*\.\s*log\s*\(\s*["'`]Olá, DevDex!["'`]\s*\)/i.test(code);
  return Response.json(passed ? { ok: true, output: "Olá, DevDex!" } : { ok: false, message: "Execute console.log com a mensagem exata para concluir a transmissão." });
}
