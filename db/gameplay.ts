import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "./client";

export type AvatarId = "nova" | "kai";
export type Avatar = { id: AvatarId; name: string; role: string; description: string; sprite: string };
export const avatars: Avatar[] = [
  { id: "kai", name: "Kai", role: "Explorador de terminal", description: "Um desenvolvedor iniciante que aprende testando cada hipótese.", sprite: "pixel-hero-kai" },
  { id: "nova", name: "Nova", role: "Arquiteta de código", description: "Uma protagonista precisa, curiosa e impossível de intimidar por bugs.", sprite: "pixel-hero-nova" },
];

export type ZoneNodeState = "locked" | "available" | "in_progress" | "completed";
export type GameNode = {
  id: number; slug: string; kind: "enemy" | "elite" | "boss" | "checkpoint"; title: string;
  enemyName: string; enemyClass: string; enemySprite: string; mentorBrief: string;
  missionSlug: string | null; state: ZoneNodeState; lives: number;
};
export type GameZone = { slug: string; name: string; description: string; theme: string; nodes: GameNode[] };
export type BattlePresentation = { zone: Omit<GameZone, "nodes">; node: GameNode };
type ZoneRow = Omit<GameZone, "nodes"> & { id: number };

export async function getPlayerProfile(userId: string) {
  return getDb().prepare("SELECT avatar_id AS avatarId,mentor_seen AS mentorSeen FROM player_profiles WHERE user_id=?").bind(userId)
    .first<{ avatarId: AvatarId | null; mentorSeen: boolean }>();
}

export async function chooseAvatar(userId: string, avatarId: AvatarId) {
  await getDb().prepare(`INSERT INTO player_profiles (user_id,avatar_id,mentor_seen) VALUES (?,?,false)
    ON CONFLICT(user_id) DO UPDATE SET avatar_id=excluded.avatar_id,updated_at=CURRENT_TIMESTAMP`).bind(userId, avatarId).run();
}

export async function markMentorSeen(userId: string) {
  await getDb().prepare("UPDATE player_profiles SET mentor_seen=true,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").bind(userId).run();
}

const nodeState = `CASE
  WHEN um.state='completed' THEN 'completed'
  WHEN EXISTS (SELECT 1 FROM mission_prerequisites mp
    LEFT JOIN user_missions required ON required.mission_id=mp.prerequisite_mission_id AND required.user_id=?
    WHERE mp.mission_id=m.id AND COALESCE(required.state,'locked')<>'completed') THEN 'locked'
  WHEN um.state='in_progress' THEN 'in_progress'
  ELSE 'available' END`;

async function getZoneNodes(userId: string, zoneId: number): Promise<GameNode[]> {
  const result = await getDb().prepare(`SELECT n.id,n.slug,n.kind,n.title,n.enemy_name AS enemyName,n.enemy_class AS enemyClass,
    n.enemy_sprite AS enemySprite,n.mentor_brief AS mentorBrief,m.slug AS missionSlug,
    ${nodeState} AS state,COALESCE(bs.lives,3) AS lives
    FROM game_zone_nodes n LEFT JOIN missions m ON m.id=n.mission_id
    LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
    LEFT JOIN user_battle_states bs ON bs.node_id=n.id AND bs.user_id=?
    WHERE n.zone_id=? ORDER BY n.sort_order`).bind(userId, userId, userId, zoneId).all<GameNode>();
  return result.results;
}

export async function getJourney(user: ChatGPTUser): Promise<{ avatarId: AvatarId | null; zones: GameZone[] }> {
  const [profile, zones] = await Promise.all([
    getPlayerProfile(user.userId),
    getDb().prepare(`SELECT id,slug,name,description,theme FROM game_zones WHERE status='published' ORDER BY sort_order`).all<ZoneRow>(),
  ]);
  return {
    avatarId: profile?.avatarId ?? null,
    zones: await Promise.all(zones.results.map(async (zone) => ({ ...zone, nodes: await getZoneNodes(user.userId, zone.id) }))),
  };
}

export async function getBattlePresentation(userId: string, missionSlug: string): Promise<BattlePresentation | null> {
  const row = await getDb().prepare(`SELECT z.id AS zoneId,z.slug AS zoneSlug,z.name AS zoneName,z.description AS zoneDescription,z.theme,
    n.id,n.slug,n.kind,n.title,n.enemy_name AS enemyName,n.enemy_class AS enemyClass,n.enemy_sprite AS enemySprite,n.mentor_brief AS mentorBrief,
    m.slug AS missionSlug,COALESCE(bs.lives,3) AS lives,
    ${nodeState} AS state
    FROM game_zone_nodes n JOIN game_zones z ON z.id=n.zone_id JOIN missions m ON m.id=n.mission_id
    LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
    LEFT JOIN user_battle_states bs ON bs.node_id=n.id AND bs.user_id=?
    WHERE m.slug=? AND z.status='published'`).bind(userId, userId, userId, missionSlug).first<GameNode & { zoneId: number; zoneSlug: string; zoneName: string; zoneDescription: string; theme: string }>();
  if (!row) return null;
  await getDb().prepare("INSERT OR IGNORE INTO user_battle_states (user_id,node_id,lives) VALUES (?,?,3)").bind(userId, row.id).run();
  const { zoneId, zoneSlug, zoneName, zoneDescription, theme, ...node } = row;
  void zoneId;
  return { zone: { slug: zoneSlug, name: zoneName, description: zoneDescription, theme }, node };
}

export async function recordBattleAttack(userId: string, missionSlug: string, passed: boolean) {
  const node = await getDb().prepare(`SELECT n.id FROM game_zone_nodes n JOIN missions m ON m.id=n.mission_id
    JOIN game_zones z ON z.id=n.zone_id WHERE m.slug=? AND z.status='published'`).bind(missionSlug).first<{ id: number }>();
  if (!node) return null;
  const db = getDb();
  await db.prepare("INSERT OR IGNORE INTO user_battle_states (user_id,node_id,lives) VALUES (?,?,3)").bind(userId, node.id).run();
  const current = await db.prepare("SELECT lives,failed_in_battle AS failedInBattle FROM user_battle_states WHERE user_id=? AND node_id=?").bind(userId, node.id).first<{ lives: number; failedInBattle: number }>();
  const livesBefore = current?.lives ?? 3;
  const perfect = passed && livesBefore === 3 && (current?.failedInBattle ?? 0) === 0;
  const livesAfter = passed ? 3 : Math.max(0, livesBefore - 1);
  const defeated = !passed && livesAfter === 0;
  await db.batch([
    db.prepare("INSERT INTO battle_attempts (user_id,node_id,status,lives_before,lives_after) VALUES (?,?,?,?,?)").bind(userId, node.id, passed ? "passed" : "failed", livesBefore, livesAfter),
    db.prepare(`UPDATE user_battle_states SET lives=?,failed_in_battle=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND node_id=?`)
      .bind(defeated ? 3 : livesAfter, defeated || passed ? 0 : (current?.failedInBattle ?? 0) + 1, userId, node.id),
  ]);
  return { lives: livesAfter, defeated, nextBattleLives: defeated ? 3 : livesAfter, perfect };
}
