import { getChatGPTUser } from "@/app/chatgpt-auth";
import { BetaAccessError, completeOnboarding, ensureUser, getOnboardingState, saveOnboardingState, type OnboardingStage } from "@/db";

const stages: OnboardingStage[] = ["intro", "path", "character", "story", "tutorial", "reward", "complete"];
const archetypes = ["adventurer", "adventuress"] as const;

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  return Response.json({ ok: true, state: await getOnboardingState(user.userId) });
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ ok: false, message: "Sessão necessária." }, { status: 401 });
  try { await ensureUser(user); } catch (error) {
    if (error instanceof BetaAccessError) return Response.json({ ok: false, message: error.message }, { status: 403 });
    throw error;
  }
  const body = await request.json().catch(() => null) as { stage?: OnboardingStage; selectedPath?: string | null; archetype?: "adventurer" | "adventuress"; complete?: boolean; reward?: boolean } | null;
  const selectedPath = typeof body?.selectedPath === "string" ? body.selectedPath.slice(0, 40) : null;
  const archetype = archetypes.includes(body?.archetype as typeof archetypes[number]) ? body?.archetype as typeof archetypes[number] : "adventurer";
  if (body?.complete) await completeOnboarding(user.userId, archetype, selectedPath, body.reward === true);
  else if (!body?.stage || !stages.includes(body.stage)) return Response.json({ ok: false, message: "Etapa inválida." }, { status: 400 });
  else await saveOnboardingState(user.userId, { stage: body.stage, selectedPath, archetype: body.archetype ?? null });
  return Response.json({ ok: true, state: await getOnboardingState(user.userId) });
}
