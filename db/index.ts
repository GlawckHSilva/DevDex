import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { getBetaConfig, isAdminEmail } from "@/lib/runtime-config";
import { getDb } from "./client";
import { missionState } from "./mission-state";
export { missionState } from "./mission-state";

export type MissionSummary = { slug: string; title: string; xpReward: number; skillName: string; pathSlug?: string; pathName?: string; state: "locked" | "available" | "in_progress" | "completed" };
export type Mission = { id: number; skillId: number; slug: string; title: string; briefing: string; objective: string; starterCode: string; functionName: string; parametersJson: string; runtime: string; runnerVersion: string; difficulty: string; version: number; xpReward: number; nextMissionSlug: string | null; pathSlug: string; campaignTitle: string; technologyName: string; state: MissionSummary["state"]; awardedXp: number };
export type MissionTest = { name: string; inputJson: string; expectedJson: string };
export type LearningPathView = { slug: string; name: string; description: string; version: number; missions: MissionSummary[] };
export type SqlMissionConfig = { dialect: string; runtimeVersion: string; schemaSql: string; seedSql: string; starterSql: string; expectedResultJson: string; tableSchemaJson: string; tablePreviewJson: string; maxRows: number; timeoutMs: number; maxStatements: number };
export type WebMissionConfig = { documentType: "html" | "css"; runtimeVersion: string; starterCode: string; previewHtml: string; previewCss: string; validatorJson: string; maxLength: number };
export type MissionStudyMaterial = { title: string; introduction: string; explanation: string; exampleCode: string; exampleExplanation: string; keyPoints: string[]; commonMistakes: string[]; references: { label: string; url: string }[] };

export class BetaAccessError extends Error {
  constructor(public reason: "closed" | "full") { super(reason === "closed" ? "Beta fechada." : "Beta lotada."); }
}

export async function ensureUser(user: ChatGPTUser) {
  const db = getDb();
  const config = getBetaConfig();
  const admin = isAdminEmail(user.email);
  if (!config.enabled && !admin) throw new BetaAccessError("closed");
  const existing = await db.prepare("SELECT 1 AS found FROM profiles WHERE user_id=?").bind(user.userId).first<{ found: number }>();
  if (!existing) {
    await db.prepare(`INSERT OR IGNORE INTO beta_members (user_id)
      SELECT ? WHERE ? OR ?=0 OR (SELECT COUNT(*) FROM beta_members)<?`).bind(user.userId, admin ? 1 : 0, config.maxUsers, config.maxUsers).run();
    const admitted = await db.prepare("SELECT 1 AS found FROM beta_members WHERE user_id=?").bind(user.userId).first<{ found: number }>();
    if (!admitted) throw new BetaAccessError("full");
  }
  await db.batch([
    db.prepare(`INSERT INTO profiles (user_id,email,display_name) VALUES (?,?,?)
      ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,display_name=excluded.display_name,updated_at=CURRENT_TIMESTAMP`).bind(user.userId, user.email, user.displayName),
    db.prepare(`INSERT OR IGNORE INTO user_missions (user_id,mission_id,state)
      SELECT ?,m.id,'available' FROM missions m WHERE m.status='published'
      AND NOT EXISTS (SELECT 1 FROM mission_prerequisites mp WHERE mp.mission_id=m.id)`).bind(user.userId),
    db.prepare(`INSERT OR IGNORE INTO user_learning_paths (user_id,learning_path_id)
      SELECT ?,id FROM learning_paths WHERE status='published'`).bind(user.userId),
    db.prepare(`INSERT OR IGNORE INTO user_project_progress (user_id,project_id,current_step_id,state)
      SELECT ?,p.id,(SELECT id FROM project_steps WHERE project_id=p.id ORDER BY sort_order LIMIT 1),'available' FROM projects p WHERE p.status='published'`).bind(user.userId),
  ]);
}

export async function getDashboard(user: ChatGPTUser) {
  const db = getDb();
  const [profile, missions] = await Promise.all([
    db.prepare("SELECT total_xp AS totalXp,level FROM profiles WHERE user_id=?").bind(user.userId).first<{ totalXp: number; level: number }>(),
    db.prepare(`SELECT m.slug,m.title,m.xp_reward AS xpReward,s.name AS skillName,lp.slug AS pathSlug,lp.name AS pathName,${missionState} AS state
      FROM missions m JOIN skills s ON s.id=m.skill_id JOIN learning_paths lp ON lp.id=s.learning_path_id
      LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
      WHERE m.status='published' ORDER BY lp.id,m.sort_order`).bind(user.userId, user.userId).all<MissionSummary>(),
  ]);
  return { profile: profile ?? { totalXp: 0, level: 1 }, missions: missions.results };
}

export async function getLearningPath(user: ChatGPTUser, slug: string): Promise<LearningPathView | null> {
  const db = getDb();
  const path = await db.prepare(`SELECT slug,name,description,version FROM learning_paths
    WHERE slug=? AND status='published'`).bind(slug).first<Omit<LearningPathView, "missions">>();
  if (!path) return null;
  const missions = await db.prepare(`SELECT m.slug,m.title,m.xp_reward AS xpReward,s.name AS skillName,${missionState} AS state
    FROM missions m JOIN skills s ON s.id=m.skill_id JOIN learning_paths lp ON lp.id=s.learning_path_id
    LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
    WHERE lp.slug=? AND m.status='published' ORDER BY m.sort_order`).bind(user.userId, user.userId, slug).all<MissionSummary>();
  return { ...path, missions: missions.results };
}

export async function getMission(userId: string, slug: string): Promise<Mission | null> {
  const mission = await getDb().prepare(`SELECT m.id,m.skill_id AS skillId,m.slug,m.title,m.briefing,m.objective,
    m.starter_code AS starterCode,m.function_name AS functionName,m.parameters_json AS parametersJson,
    m.runtime,m.runner_version AS runnerVersion,m.difficulty,m.version,
    m.xp_reward AS xpReward,m.next_mission_slug AS nextMissionSlug,lp.slug AS pathSlug,
    COALESCE(c.title,lp.name) AS campaignTitle,t.name AS technologyName,${missionState} AS state,
    COALESCE(um.awarded_xp,0) AS awardedXp
    FROM missions m JOIN skills s ON s.id=m.skill_id JOIN learning_paths lp ON lp.id=s.learning_path_id
    JOIN technologies t ON t.id=lp.technology_id LEFT JOIN campaigns c ON c.learning_path_id=lp.id
    LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
    WHERE m.slug=? AND m.status='published'`).bind(userId, userId, slug).first<Mission>();
  return mission ? { ...mission, starterCode: mission.starterCode.replaceAll("\\n", "\n") } : null;
}

export async function getMissionTests(missionId: number): Promise<MissionTest[]> {
  const result = await getDb().prepare("SELECT name,input_json AS inputJson,expected_json AS expectedJson FROM mission_tests WHERE mission_id=? ORDER BY sort_order").bind(missionId).all<MissionTest>();
  return result.results;
}

export async function getMissionStudyMaterial(missionId: number): Promise<MissionStudyMaterial | null> {
  const material = await getDb().prepare(`SELECT title,introduction,explanation,example_code AS exampleCode,
    example_explanation AS exampleExplanation,key_points_json AS keyPointsJson,
    common_mistakes_json AS commonMistakesJson,references_json AS referencesJson
    FROM mission_study_materials WHERE mission_id=?`).bind(missionId).first<Omit<MissionStudyMaterial, "keyPoints" | "commonMistakes" | "references"> & { keyPointsJson: string; commonMistakesJson: string; referencesJson: string }>();
  return material ? { ...material, keyPoints: JSON.parse(material.keyPointsJson), commonMistakes: JSON.parse(material.commonMistakesJson), references: JSON.parse(material.referencesJson) } : null;
}

export async function getSqlMissionConfig(missionId: number): Promise<SqlMissionConfig | null> {
  const config = await getDb().prepare(`SELECT dialect,runtime_version AS runtimeVersion,schema_sql AS schemaSql,seed_sql AS seedSql,
    starter_sql AS starterSql,expected_result_json AS expectedResultJson,table_schema_json AS tableSchemaJson,
    table_preview_json AS tablePreviewJson,max_rows AS maxRows,timeout_ms AS timeoutMs,max_statements AS maxStatements
    FROM sql_mission_configs WHERE mission_id=?`).bind(missionId).first<SqlMissionConfig>();
  return config ? { ...config, starterSql: config.starterSql.replaceAll("\\n", "\n") } : null;
}

export async function getWebMissionConfig(missionId: number): Promise<WebMissionConfig | null> {
  const config = await getDb().prepare(`SELECT document_type AS documentType,runtime_version AS runtimeVersion,
    starter_code AS starterCode,preview_html AS previewHtml,preview_css AS previewCss,
    validator_json AS validatorJson,max_length AS maxLength FROM web_mission_configs WHERE mission_id=?`)
    .bind(missionId).first<WebMissionConfig>();
  return config ? { ...config, starterCode: config.starterCode.replaceAll("\\n", "\n"), previewHtml: config.previewHtml.replaceAll("\\n", "\n"), previewCss: config.previewCss.replaceAll("\\n", "\n") } : null;
}

export async function recordAttempt(userId: string, mission: Mission, passed: boolean) {
  const db = getDb();
  if (!passed) {
    await db.batch([
      db.prepare(`INSERT INTO user_missions (user_id,mission_id,state,attempts) VALUES (?,?,'in_progress',1)
        ON CONFLICT(user_id,mission_id) DO UPDATE SET attempts=attempts+1,
        state=CASE WHEN state='completed' THEN 'completed' ELSE 'in_progress' END`).bind(userId, mission.id),
      db.prepare(`INSERT INTO user_skill_progress (user_id,skill_id,failed_attempts) VALUES (?,?,1)
        ON CONFLICT(user_id,skill_id) DO UPDATE SET failed_attempts=failed_attempts+1`).bind(userId, mission.skillId),
    ]);
    return { gainedXp: 0, totalXp: null, unlockedSlug: null, newlyCompleted: false };
  }

  const statements = [
    db.prepare("INSERT OR IGNORE INTO user_missions (user_id,mission_id,state) VALUES (?,?,'available')").bind(userId, mission.id),
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
  const results = await db.batch(statements);
  const profile = await db.prepare("SELECT total_xp AS totalXp FROM profiles WHERE user_id=?").bind(userId).first<{ totalXp: number }>();
  const newlyCompleted = results[1]?.meta?.changes === 1;
  const gainedXp = newlyCompleted ? mission.xpReward : 0;
  return { gainedXp, totalXp: profile?.totalXp ?? 0, unlockedSlug: mission.nextMissionSlug, newlyCompleted };
}

export * from "./schema";
export * from "./projects";
export * from "./metrics";
export * from "./adventure";
export * from "./campaigns";
