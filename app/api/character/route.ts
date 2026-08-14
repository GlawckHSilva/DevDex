import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, chooseCharacter, ensureUser, type Archetype } from "@/db";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const payload = await request.json().catch(() => null) as { archetype?: Archetype } | null;
  if (payload?.archetype !== "adventurer" && payload?.archetype !== "adventuress") return Response.json({ ok: false, message: "Personagem inválido." }, { status: 400 });
  return Response.json({ ok: true, character: await chooseCharacter(user.userId, payload.archetype) });
}
