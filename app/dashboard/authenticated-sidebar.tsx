import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { signOutPath } from "@/app/chatgpt-auth";
import { getCampaignSummaries, getDashboard } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";
import { AppSidebar } from "./sidebar";

export async function AuthenticatedSidebar({ user, activePath }: { user: ChatGPTUser; activePath: string }) {
  const [campaigns, { profile }] = await Promise.all([getCampaignSummaries(user.userId), getDashboard(user)]);
  return <AppSidebar campaigns={campaigns} skillPoints={profile.skillPoints} admin={isAdminEmail(user.email)} signOutHref={signOutPath(user)} activePath={activePath} />;
}
