import { getChatGPTUser } from "@/app/chatgpt-auth";
import { answerContentQuiz, BetaAccessError, ensureUser, getLibraryContent } from "@/db";

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
  const form = await request.formData();
  const rawAnswer = form.get("answer");
  const answer = typeof rawAnswer === "string" && rawAnswer.trim() ? Number(rawAnswer) : Number.NaN;
  const result = await answerContentQuiz(user.userId, content.id, answer);
  if (!result) return Response.json({ ok: false, message: "Resposta inválida." }, { status: 400 });
  const status = result.correct ? "correto" : "revisar";
  return Response.redirect(new URL(`/biblioteca/${content.slug}?quiz=${status}&intervalo=${result.intervalDays}`, request.url), 303);
}
