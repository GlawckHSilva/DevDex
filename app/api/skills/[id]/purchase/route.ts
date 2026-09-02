import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, ensureUser, purchaseAbility } from "@/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const result = await purchaseAbility(user.userId, (await params).id);
  return Response.json(result, { status: result.ok ? 200 : 409 });
}
