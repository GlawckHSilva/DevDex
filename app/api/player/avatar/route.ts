import { getChatGPTUser } from "@/app/chatgpt-auth";
import { avatars, chooseAvatar, ensureUser, type AvatarId } from "@/db";

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  let payload: { avatarId?: string };
  try { payload = await request.json() as { avatarId?: string }; }
  catch { return Response.json({ ok: false, message: "Escolha inválida." }, { status: 400 }); }
  if (!avatars.some((avatar) => avatar.id === payload.avatarId)) return Response.json({ ok: false, message: "Avatar inválido." }, { status: 400 });
  await ensureUser(user);
  await chooseAvatar(user.userId, payload.avatarId as AvatarId);
  return Response.json({ ok: true, avatarId: payload.avatarId });
}
