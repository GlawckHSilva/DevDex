import { getDb } from "./client";

export type OnboardingStage = "intro" | "path" | "character" | "story" | "tutorial" | "reward" | "complete";
export type OnboardingState = { stage: OnboardingStage; selectedPath: string | null; archetype: "adventurer" | "adventuress" | null; completed: boolean };

export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  return getDb().prepare(`SELECT stage,selected_path AS selectedPath,archetype,completed_at IS NOT NULL AS completed
    FROM user_onboarding WHERE user_id=?`).bind(userId).first<OnboardingState>();
}

export async function saveOnboardingState(userId: string, state: Pick<OnboardingState, "stage" | "selectedPath" | "archetype">) {
  await getDb().prepare(`INSERT INTO user_onboarding (user_id,stage,selected_path,archetype)
    VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET stage=excluded.stage,selected_path=excluded.selected_path,archetype=excluded.archetype,updated_at=CURRENT_TIMESTAMP`)
    .bind(userId, state.stage, state.selectedPath, state.archetype).run();
}

export async function completeOnboarding(userId: string, archetype: "adventurer" | "adventuress", selectedPath: string | null, reward: boolean) {
  const db = getDb();
  await db.prepare(`INSERT INTO user_onboarding (user_id,stage,selected_path,archetype,completed_at)
    VALUES (?,'complete',?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET stage='complete',selected_path=excluded.selected_path,archetype=excluded.archetype,completed_at=COALESCE(user_onboarding.completed_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP`)
    .bind(userId, selectedPath, archetype).run();
  if (reward) {
    const claimed = await db.prepare("UPDATE user_onboarding SET rewarded_xp=1 WHERE user_id=? AND rewarded_xp=0").bind(userId).run();
    if (claimed.meta?.changes) await db.prepare("UPDATE profiles SET total_xp=total_xp+50,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(userId).run();
  }
  await db.prepare("INSERT OR IGNORE INTO user_characters (user_id,archetype) VALUES (?,?)").bind(userId, archetype).run();
}
