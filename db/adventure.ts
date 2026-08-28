import { getDb } from "./client";
import type { MissionSummary } from "./index";

export type Archetype = "adventurer" | "adventuress";
export type Character = { archetype: Archetype };
export type BattleConfig = { missionId: number; zoneSlug: string; enemyName: string; enemyType: "enemy" | "elite" | "boss"; enemyLevel: number; hint: string; sortOrder: number };
export type BattleState = { lives: number; state: "active" | "defeated" | "completed" };
export type ZoneNode = BattleConfig & { missionSlug: string; missionTitle: string; missionState: MissionSummary["state"]; battleState: BattleState["state"] | null };

export async function getCharacter(userId: string) {
  return getDb().prepare("SELECT archetype FROM user_characters WHERE user_id=?").bind(userId).first<Character>();
}

export async function chooseCharacter(userId: string, archetype: Archetype) {
  await getDb().prepare("INSERT OR IGNORE INTO user_characters (user_id,archetype) VALUES (?,?)").bind(userId, archetype).run();
  return getCharacter(userId);
}

export async function getAdventure(userId: string) {
  const db = getDb();
  const [character, nodes] = await Promise.all([
    getCharacter(userId),
    db.prepare(`SELECT mbc.mission_id AS missionId,mbc.zone_slug AS zoneSlug,mbc.enemy_name AS enemyName,
      mbc.enemy_type AS enemyType,mbc.enemy_level AS enemyLevel,mbc.hint,mbc.sort_order AS sortOrder,
      m.slug AS missionSlug,m.title AS missionTitle,
      CASE WHEN um.state='completed' THEN 'completed'
        WHEN EXISTS (SELECT 1 FROM mission_prerequisites mp LEFT JOIN user_missions req ON req.mission_id=mp.prerequisite_mission_id AND req.user_id=? WHERE mp.mission_id=m.id AND COALESCE(req.state,'locked')<>'completed') THEN 'locked'
        WHEN um.state='in_progress' THEN 'in_progress' ELSE 'available' END AS missionState,
      ub.state AS battleState
      FROM mission_battle_configs mbc JOIN missions m ON m.id=mbc.mission_id
      LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
      LEFT JOIN user_battles ub ON ub.mission_id=m.id AND ub.user_id=?
      WHERE mbc.zone_slug='bosque-dos-fundamentos' ORDER BY mbc.sort_order`).bind(userId, userId, userId).all<ZoneNode>(),
  ]);
  return { character, nodes: nodes.results };
}

export async function getBattle(userId: string, missionId: number, missionCompleted: boolean, replay = false) {
  const db = getDb();
  const config = await db.prepare(`SELECT mission_id AS missionId,zone_slug AS zoneSlug,enemy_name AS enemyName,
    enemy_type AS enemyType,enemy_level AS enemyLevel,hint,sort_order AS sortOrder
    FROM mission_battle_configs WHERE mission_id=?`).bind(missionId).first<BattleConfig>();
  if (!config) return null;
  await db.prepare(`INSERT OR IGNORE INTO user_battles (user_id,mission_id,state,lives,completed_at)
    VALUES (?,?,?,3,CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)`).bind(userId, missionId, missionCompleted ? "completed" : "active", missionCompleted ? 1 : 0).run();
  if (missionCompleted && replay) await db.prepare(`UPDATE user_battles SET lives=3,state='active',started_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE user_id=? AND mission_id=? AND EXISTS (SELECT 1 FROM user_missions WHERE user_id=? AND mission_id=? AND state='completed')`)
    .bind(userId, missionId, userId, missionId).run();
  const battle = await db.prepare("SELECT lives,state FROM user_battles WHERE user_id=? AND mission_id=?").bind(userId, missionId).first<BattleState>();
  return battle ? { ...config, ...battle } : null;
}

export async function researchBattle(userId: string, config: BattleConfig) {
  const db = getDb();
  await db.batch([
    db.prepare("UPDATE user_battles SET researches=researches+1,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=?").bind(userId, config.missionId),
    db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) SELECT ?,?,'research','shown',lives FROM user_battles WHERE user_id=? AND mission_id=?").bind(userId, config.missionId, userId, config.missionId),
  ]);
  const state = await getBattleState(userId, config.missionId);
  return { ...state, hint: config.hint };
}

export async function reviveBattle(userId: string, missionId: number) {
  const db = getDb();
  await db.batch([
    db.prepare("UPDATE user_battles SET lives=3,state='active',started_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=? AND state='defeated'").bind(userId, missionId),
    db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) VALUES (?,?,'revive','reset',3)").bind(userId, missionId),
  ]);
  return getBattleState(userId, missionId);
}

export async function getRecentBattleEventCount(userId: string, minutes = 5) {
  const row = await getDb().prepare("SELECT COUNT(*) AS count FROM battle_events WHERE user_id=? AND created_at>=datetime('now',?)")
    .bind(userId, `-${minutes} minutes`).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function recordBattleAction(userId: string, missionId: number, action: "test" | "attack", outcome: "passed" | "progress" | "failed" | "error") {
  const db = getDb();
  if (action === "attack") {
    await db.prepare(`UPDATE user_battles SET
      lives=CASE WHEN ? IN ('passed','progress') THEN lives ELSE MAX(0,lives-1) END,
      state=CASE WHEN ?='passed' THEN 'completed' WHEN ? NOT IN ('passed','progress') AND lives<=1 THEN 'defeated' ELSE 'active' END,
      defeats=defeats+CASE WHEN ? NOT IN ('passed','progress') AND lives<=1 THEN 1 ELSE 0 END,
      completed_at=CASE WHEN ?='passed' THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE completed_at END,
      updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=?`).bind(outcome, outcome, outcome, outcome, outcome, userId, missionId).run();
  }
  const state = await getBattleState(userId, missionId);
  if (!state) return null;
  await db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) VALUES (?,?,?,?,?)")
    .bind(userId, missionId, action, outcome, state.lives).run();
  return state;
}

async function getBattleState(userId: string, missionId: number) {
  return getDb().prepare("SELECT lives,state FROM user_battles WHERE user_id=? AND mission_id=?").bind(userId, missionId).first<BattleState>();
}
