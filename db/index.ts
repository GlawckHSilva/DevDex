import { env } from "cloudflare:workers";
import type { ChatGPTUser } from "@/app/chatgpt-auth";

type D1Result<T = unknown> = { results: T[]; success: boolean };
type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};
type D1Database = { prepare(sql: string): D1Statement; batch(statements: D1Statement[]): Promise<D1Result[]> };

export type MissionSummary = { slug: string; title: string; xpReward: number; skillName: string; state: "locked" | "available" | "in_progress" | "completed" };
export type Mission = { id: number; skillId: number; slug: string; title: string; briefing: string; objective: string; starterCode: string; functionName: string; parametersJson: string; xpReward: number; nextMissionSlug: string | null; state: MissionSummary["state"]; awardedXp: number };
export type MissionTest = { name: string; inputJson: string; expectedJson: string };

function getDb(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}

export async function ensureUser(user: ChatGPTUser) {
  const db = getDb();
  await db.batch([
    db.prepare(`INSERT INTO profiles (user_id,email,display_name) VALUES (?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,updated_at=CURRENT_TIMESTAMP`).bind(user.userId, user.email, user.displayName),
    db.prepare(`INSERT OR IGNORE INTO user_missions (user_id,mission_id,state)
      SELECT ?,id,'available' FROM missions ORDER BY sort_order LIMIT 1`).bind(user.userId),
  ]);
}

export async function getDashboard(user: ChatGPTUser) {
  await ensureUser(user);
  const db = getDb();
  const [profile, missions] = await Promise.all([
    db.prepare("SELECT total_xp AS totalXp,level FROM profiles WHERE user_id=?").bind(user.userId).first<{ totalXp: number; level: number }>(),
    db.prepare(`SELECT m.slug,m.title,m.xp_reward AS xpReward,s.name AS skillName,
      COALESCE(um.state,CASE WHEN m.sort_order=1 THEN 'available' ELSE 'locked' END) AS state
      FROM missions m JOIN skills s ON s.id=m.skill_id
      LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=? ORDER BY m.sort_order`).bind(user.userId).all<MissionSummary>(),
  ]);
  return { profile: profile ?? { totalXp: 0, level: 1 }, missions: missions.results };
}

export async function getMission(userId: string, slug: string): Promise<Mission | null> {
  return getDb().prepare(`SELECT m.id,m.skill_id AS skillId,m.slug,m.title,m.briefing,m.objective,
    m.starter_code AS starterCode,m.function_name AS functionName,m.parameters_json AS parametersJson,
    m.xp_reward AS xpReward,m.next_mission_slug AS nextMissionSlug,
    COALESCE(um.state,CASE WHEN m.sort_order=1 THEN 'available' ELSE 'locked' END) AS state,
    COALESCE(um.awarded_xp,0) AS awardedXp
    FROM missions m LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=? WHERE m.slug=?`).bind(userId, slug).first<Mission>();
}

export async function getMissionTests(missionId: number): Promise<MissionTest[]> {
  const result = await getDb().prepare("SELECT name,input_json AS inputJson,expected_json AS expectedJson FROM mission_tests WHERE mission_id=? ORDER BY sort_order").bind(missionId).all<MissionTest>();
  return result.results;
}

export async function recordAttempt(userId: string, mission: Mission, passed: boolean) {
  const db = getDb();
  if (!passed) {
    await db.batch([
      db.prepare("UPDATE user_missions SET attempts=attempts+1,state='in_progress' WHERE user_id=? AND mission_id=?").bind(userId, mission.id),
      db.prepare(`INSERT INTO user_skill_progress (user_id,skill_id,failed_attempts) VALUES (?,?,1)
        ON CONFLICT(user_id,skill_id) DO UPDATE SET failed_attempts=failed_attempts+1`).bind(userId, mission.skillId),
    ]);
    return { gainedXp: 0, totalXp: null, unlockedSlug: null };
  }

  const statements = [
    db.prepare(`UPDATE profiles SET total_xp=total_xp+?,level=CAST((total_xp+?)/500 AS INTEGER)+1,updated_at=CURRENT_TIMESTAMP
      WHERE user_id=? AND EXISTS (SELECT 1 FROM user_missions WHERE user_id=? AND mission_id=? AND awarded_xp=0)`).bind(mission.xpReward, mission.xpReward, userId, userId, mission.id),
    db.prepare(`INSERT OR IGNORE INTO user_xp_history (user_id,mission_id,amount,reason)
      SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM user_missions WHERE user_id=? AND mission_id=? AND awarded_xp=0)`).bind(userId, mission.id, mission.xpReward, `mission:${mission.slug}`, userId, mission.id),
    db.prepare("UPDATE user_missions SET attempts=attempts+1,state='completed',awarded_xp=?,completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE user_id=? AND mission_id=?").bind(mission.xpReward, userId, mission.id),
    db.prepare(`INSERT INTO user_skill_progress (user_id,skill_id,mastery,successful_attempts) VALUES (?,?,50,1)
      ON CONFLICT(user_id,skill_id) DO UPDATE SET mastery=MIN(100,MAX(mastery,50)+10),successful_attempts=successful_attempts+1`).bind(userId, mission.skillId),
  ];
  if (mission.nextMissionSlug) {
    statements.push(db.prepare(`INSERT OR IGNORE INTO user_missions (user_id,mission_id,state)
      SELECT ?,id,'available' FROM missions WHERE slug=?`).bind(userId, mission.nextMissionSlug));
  }
  await db.batch(statements);
  const profile = await db.prepare("SELECT total_xp AS totalXp FROM profiles WHERE user_id=?").bind(userId).first<{ totalXp: number }>();
  return { gainedXp: mission.awardedXp === 0 ? mission.xpReward : 0, totalXp: profile?.totalXp ?? 0, unlockedSlug: mission.nextMissionSlug };
}

export * from "./schema";
