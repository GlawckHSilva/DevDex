import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, ensureUser, markCampaignLoreSeen } from "@/db";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const { slug } = await params;
  if (!await markCampaignLoreSeen(user.userId, slug)) return Response.json({ ok: false, message: "Campanha não encontrada." }, { status: 404 });
  return Response.json({ ok: true });
}
