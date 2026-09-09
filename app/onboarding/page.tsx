import { redirect } from "next/navigation";
import { getCharacter, getDashboard, getOnboardingState } from "@/db";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { OnboardingExperience } from "./onboarding-experience";

export const dynamic = "force-dynamic";
export const metadata = { title: "Primeira transmissão" };

export default async function OnboardingPage() {
  const user = await requireChatGPTUser("/onboarding");
  const [character, state, { profile }] = await Promise.all([getCharacter(user.userId), getOnboardingState(user.userId), getDashboard(user)]);
  if (character || profile.totalXp > 0 || state?.completed) redirect("/dashboard");
  return <OnboardingExperience initialStage={state?.stage ?? "intro"} initialPath={state?.selectedPath ?? "frontend"} initialArchetype={state?.archetype ?? "adventurer"} displayName={user.displayName.split("@")[0]} />;
}
