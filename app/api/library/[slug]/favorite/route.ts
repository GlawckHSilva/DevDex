import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, ensureUser, getLibraryContent, toggleContentFavorite } from "@/db";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const { slug } = await params;
  const content = await getLibraryContent(user.userId, slug);
  if (!content) return Response.json({ ok: false, message: "Conteúdo não encontrado." }, { status: 404 });
  await toggleContentFavorite(user.userId, content.id);
  return Response.redirect(new URL(`/biblioteca/${content.slug}`, request.url), 303);
}
