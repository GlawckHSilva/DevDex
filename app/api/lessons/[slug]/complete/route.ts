import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, completeStudyLesson, ensureUser, getStudyLesson } from "@/db";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); }
  catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const { slug } = await params;
  const lesson = await getStudyLesson(user.userId, slug);
  if (!lesson) return Response.json({ ok: false, message: "Material não encontrado." }, { status: 404 });
  if (!await completeStudyLesson(user.userId, lesson)) return Response.json({ ok: false, message: "Material bloqueado." }, { status: 403 });
  return Response.redirect(new URL(`/missoes/${lesson.firstMissionSlug}`, request.url), 303);
}
