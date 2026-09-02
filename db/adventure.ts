import { getDb } from "./client";
import type { MissionSummary } from "./index";
import { getNextHintPreview, getUserProgression, spendHeart, unlockMissionHint } from "./progression";

export type Archetype = "adventurer" | "adventuress";
export type Character = { archetype: Archetype };
export type BattleConfig = { missionId: number; zoneSlug: string; enemyName: string; enemyType: "enemy" | "elite" | "boss"; enemyLevel: number; hint: string; sortOrder: number };
export type BattleState = { lives: number; maxLives: number; hints: number; maxHints: number; nextHeartMinutes: number | null; nextHintMinutes: number | null; state: "active" | "defeated" | "completed"; unlockedHint?: string | null; nextHintType?: string | null };
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
    VALUES (?,?,?,5,CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE NULL END)`).bind(userId, missionId, missionCompleted ? "completed" : "active", missionCompleted ? 1 : 0).run();
  if (missionCompleted && replay) await db.prepare(`UPDATE user_battles SET state='active',started_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP
    WHERE user_id=? AND mission_id=? AND EXISTS (SELECT 1 FROM user_missions WHERE user_id=? AND mission_id=? AND state='completed')`)
    .bind(userId, missionId, userId, missionId).run();
  const battle = await getBattleState(userId, missionId);
  return battle ? { ...config, ...battle } : null;
}

export async function researchBattle(userId: string, config: BattleConfig) {
  const db = getDb();
  const unlocked = await unlockMissionHint(userId, config.missionId);
  if ("unavailable" in unlocked && unlocked.unavailable) return { ...(await getBattleState(userId, config.missionId)), progression: unlocked.progression, hintUnavailable: true, alreadyUnlocked: false, hint: null };
  await db.batch([
    db.prepare("UPDATE user_battles SET researches=researches+1,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=?").bind(userId, config.missionId),
    db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) SELECT ?,?,'research','shown',lives FROM user_battles WHERE user_id=? AND mission_id=?").bind(userId, config.missionId, userId, config.missionId),
  ]);
  const state = await getBattleState(userId, config.missionId);
  return { ...state, hint: unlocked.hint?.content ?? config.hint, hintLevel: unlocked.hint?.level ?? 0, hintType: unlocked.hint?.type ?? null, alreadyUnlocked: unlocked.alreadyUnlocked, hintUnavailable: false, progression: unlocked.progression };
}

export async function reviveBattle(userId: string, missionId: number) {
  const db = getDb();
  const progression = await getUserProgression(userId);
  await db.batch([
    db.prepare("UPDATE user_battles SET state=CASE WHEN ? > 0 THEN 'active' ELSE 'defeated' END,started_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=? AND state='defeated'").bind(progression.hearts, userId, missionId),
    db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) VALUES (?,?,'revive','reset',?)").bind(userId, missionId, progression.hearts),
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
    const progression = outcome === "progress" ? await getUserProgression(userId) : (await spendHeart(userId, outcome === "passed")).progression;
    await db.prepare(`UPDATE user_battles SET
      lives=?,
      state=CASE WHEN ?='passed' THEN 'completed' WHEN ?=0 THEN 'defeated' ELSE 'active' END,
      defeats=defeats+CASE WHEN ?<>'passed' AND ?=0 THEN 1 ELSE 0 END,
      completed_at=CASE WHEN ?='passed' THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE completed_at END,
      updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=?`).bind(progression.hearts, outcome, progression.hearts, outcome, progression.hearts, outcome, userId, missionId).run();
  }
  const state = await getBattleState(userId, missionId);
  if (!state) return null;
  await db.prepare("INSERT INTO battle_events (user_id,mission_id,action,outcome,lives_after) VALUES (?,?,?,?,?)")
    .bind(userId, missionId, action, outcome, state.lives).run();
  return state;
}

async function getBattleState(userId: string, missionId: number) {
  const db = getDb();
  const [battle, progression, nextHint, unlockedHint] = await Promise.all([
    db.prepare("SELECT state FROM user_battles WHERE user_id=? AND mission_id=?").bind(userId, missionId).first<{ state: BattleState["state"] }>(),
    getUserProgression(userId), getNextHintPreview(userId, missionId),
    db.prepare(`SELECT mh.content FROM mission_hints mh JOIN user_mission_hints umh ON umh.mission_id=mh.mission_id AND umh.hint_level=mh.hint_level
      WHERE umh.user_id=? AND mh.mission_id=? ORDER BY mh.hint_level DESC LIMIT 1`).bind(userId, missionId).first<{ content: string }>(),
  ]);
  if (!battle) return null;
  const state: BattleState["state"] = battle.state === "completed" ? "completed" : progression.hearts === 0 ? "defeated" : "active";
  if (state !== battle.state) await db.prepare("UPDATE user_battles SET state=?,lives=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND mission_id=?").bind(state, progression.hearts, userId, missionId).run();
  return { lives: progression.hearts, maxLives: progression.maxHearts, hints: progression.hints, maxHints: progression.maxHints, nextHeartMinutes: progression.nextHeartMinutes, nextHintMinutes: progression.nextHintMinutes, state, unlockedHint: unlockedHint?.content ?? null, nextHintType: nextHint?.type ?? null };
}
