import { levelFromXp, missionXpReward, regenerateResource, xpProgress } from "@/lib/progression";
import { getDb } from "./client";

type Balance = { maxHearts: number; heartRegenMinutes: number; maxHints: number; hintRegenMinutes: number; hintPenaltyPercent: number; minimumXpPercent: number };
type ResourceRow = { hearts: number; heartUpdatedAt: string; hints: number; hintUpdatedAt: string; secondChanceUsedOn: string | null; lastBreathUsedOn: string | null };
type AbilityEffect = { effectKey: string; value: number };
export type LevelUp = { fromLevel: number; toLevel: number; skillPointsGained: number } | null;

const DEFAULT_BALANCE: Balance = { maxHearts: 5, heartRegenMinutes: 60, maxHints: 3, hintRegenMinutes: 300, hintPenaltyPercent: 10, minimumXpPercent: 70 };

function d1Date(date: Date) { return date.toISOString().slice(0, 19).replace("T", " "); }
function parseD1Date(value: string) { return new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`); }
function minutesUntil(value: Date | null, now: Date) { return value ? Math.max(0, Math.ceil((value.getTime() - now.getTime()) / 60_000)) : null; }

async function getBalance(): Promise<Balance> {
  const rows = await getDb().prepare("SELECT key,value FROM game_balance_settings").all<{ key: string; value: number }>();
  const values = Object.fromEntries(rows.results.map((row) => [row.key, row.value]));
  return {
    maxHearts: values.max_hearts ?? DEFAULT_BALANCE.maxHearts,
    heartRegenMinutes: values.heart_regen_minutes ?? DEFAULT_BALANCE.heartRegenMinutes,
    maxHints: values.max_hints ?? DEFAULT_BALANCE.maxHints,
    hintRegenMinutes: values.hint_regen_minutes ?? DEFAULT_BALANCE.hintRegenMinutes,
    hintPenaltyPercent: values.hint_penalty_percent ?? DEFAULT_BALANCE.hintPenaltyPercent,
    minimumXpPercent: values.minimum_xp_percent ?? DEFAULT_BALANCE.minimumXpPercent,
  };
}

async function getEffects(userId: string) {
  const rows = await getDb().prepare(`SELECT sa.effect_key AS effectKey,sa.effect_value*ua.rank AS value
    FROM user_abilities ua JOIN skill_abilities sa ON sa.id=ua.skill_id WHERE ua.user_id=?`).bind(userId).all<AbilityEffect>();
  return rows.results;
}

function effectValue(effects: AbilityEffect[], key: string) { return effects.filter((effect) => effect.effectKey === key).reduce((sum, effect) => sum + effect.value, 0); }
function hasEffect(effects: AbilityEffect[], key: string) { return effects.some((effect) => effect.effectKey === key); }

export async function syncProfileProgression(userId: string): Promise<LevelUp> {
  const db = getDb();
  const profile = await db.prepare(`SELECT total_xp AS totalXp,level,skill_points_earned AS skillPointsEarned
    FROM profiles WHERE user_id=?`).bind(userId).first<{ totalXp: number; level: number; skillPointsEarned: number }>();
  if (!profile) return null;
  const targetLevel = Math.max(profile.level, levelFromXp(profile.totalXp));
  const earned = Math.max(profile.skillPointsEarned, targetLevel - 1);
  await db.prepare("UPDATE profiles SET level=?,skill_points_earned=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?")
    .bind(targetLevel, earned, userId).run();
  if (targetLevel <= profile.level) return null;
  await db.batch(Array.from({ length: targetLevel - profile.level }, (_, index) => db.prepare(
    "INSERT OR IGNORE INTO level_up_history (user_id,level,skill_points_granted) VALUES (?,?,1)",
  ).bind(userId, profile.level + index + 1)));
  return { fromLevel: profile.level, toLevel: targetLevel, skillPointsGained: targetLevel - profile.level };
}

export async function getUserProgression(userId: string, now = new Date()) {
  const db = getDb();
  await db.prepare("INSERT OR IGNORE INTO user_resources (user_id) VALUES (?)").bind(userId).run();
  await syncProfileProgression(userId);
  const [profile, resources, balance, effects] = await Promise.all([
    db.prepare(`SELECT total_xp AS totalXp,level,skill_points_earned AS skillPointsEarned,
      skill_points_spent AS skillPointsSpent FROM profiles WHERE user_id=?`).bind(userId).first<{ totalXp: number; level: number; skillPointsEarned: number; skillPointsSpent: number }>(),
    db.prepare(`SELECT hearts,heart_updated_at AS heartUpdatedAt,hints,hint_updated_at AS hintUpdatedAt,
      second_chance_used_on AS secondChanceUsedOn,last_breath_used_on AS lastBreathUsedOn FROM user_resources WHERE user_id=?`).bind(userId).first<ResourceRow>(),
    getBalance(), getEffects(userId),
  ]);
  if (!profile || !resources) throw new Error("Perfil de progressão indisponível.");
  const heartInterval = Math.max(50, balance.heartRegenMinutes + effectValue(effects, "heart_regen_delta"));
  const hintInterval = Math.max(240, balance.hintRegenMinutes + effectValue(effects, "hint_regen_delta"));
  const hearts = regenerateResource(resources.hearts, balance.maxHearts, parseD1Date(resources.heartUpdatedAt), now, heartInterval);
  const hints = regenerateResource(resources.hints, balance.maxHints, parseD1Date(resources.hintUpdatedAt), now, hintInterval);
  if (hearts.value !== resources.hearts || hints.value !== resources.hints) {
    await db.prepare(`UPDATE user_resources SET hearts=?,heart_updated_at=?,hints=?,hint_updated_at=? WHERE user_id=?`)
      .bind(hearts.value, d1Date(hearts.updatedAt), hints.value, d1Date(hints.updatedAt), userId).run();
  }
  const xp = xpProgress(profile.totalXp);
  return {
    ...xp, level: profile.level, hearts: hearts.value, maxHearts: balance.maxHearts,
    hints: hints.value, maxHints: balance.maxHints, skillPoints: Math.max(0, profile.skillPointsEarned - profile.skillPointsSpent),
    skillPointsEarned: profile.skillPointsEarned, nextHeartMinutes: minutesUntil(hearts.nextAt, now),
    nextHintMinutes: minutesUntil(hints.nextAt, now), heartRegenMinutes: heartInterval, hintRegenMinutes: hintInterval,
  };
}

export async function spendHeart(userId: string, correct: boolean, now = new Date()) {
  const db = getDb();
  const progression = await getUserProgression(userId, now);
  const effects = await getEffects(userId);
  const today = now.toISOString().slice(0, 10);
  const resource = await db.prepare(`SELECT second_chance_used_on AS secondChanceUsedOn,last_breath_used_on AS lastBreathUsedOn
    FROM user_resources WHERE user_id=?`).bind(userId).first<Pick<ResourceRow, "secondChanceUsedOn" | "lastBreathUsedOn">>();
  if (correct) {
    if (progression.hearts === 1 && hasEffect(effects, "last_breath") && resource?.lastBreathUsedOn !== today) {
      await db.prepare("UPDATE user_resources SET hearts=MIN(?,hearts+1),heart_updated_at=CURRENT_TIMESTAMP,last_breath_used_on=? WHERE user_id=?")
        .bind(progression.maxHearts, today, userId).run();
    }
    return { consumed: false, protected: false, progression: await getUserProgression(userId, now) };
  }
  if (progression.hearts <= 0) return { consumed: false, protected: false, progression };
  if (hasEffect(effects, "second_chance") && resource?.secondChanceUsedOn !== today) {
    await db.prepare("UPDATE user_resources SET second_chance_used_on=? WHERE user_id=?").bind(today, userId).run();
    return { consumed: false, protected: true, progression };
  }
  await db.prepare("UPDATE user_resources SET hearts=MAX(0,hearts-1),heart_updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND hearts>0").bind(userId).run();
  return { consumed: true, protected: false, progression: await getUserProgression(userId, now) };
}

export async function unlockMissionHint(userId: string, missionId: number, now = new Date()) {
  const db = getDb();
  const progression = await getUserProgression(userId, now);
  const unlocked = await db.prepare("SELECT COALESCE(MAX(hint_level),0) AS level FROM user_mission_hints WHERE user_id=? AND mission_id=?")
    .bind(userId, missionId).first<{ level: number }>();
  const nextLevel = (unlocked?.level ?? 0) + 1;
  const hint = await db.prepare("SELECT hint_level AS level,hint_type AS type,content FROM mission_hints WHERE mission_id=? AND hint_level=?")
    .bind(missionId, nextLevel).first<{ level: number; type: string; content: string }>();
  if (!hint) {
    const latest = await db.prepare(`SELECT mh.hint_level AS level,mh.hint_type AS type,mh.content FROM mission_hints mh
      JOIN user_mission_hints umh ON umh.mission_id=mh.mission_id AND umh.hint_level=mh.hint_level
      WHERE umh.user_id=? AND mh.mission_id=? ORDER BY mh.hint_level DESC LIMIT 1`).bind(userId, missionId).first<{ level: number; type: string; content: string }>();
    return { hint: latest, alreadyUnlocked: true, progression };
  }
  if (progression.hints <= 0) return { hint: null, alreadyUnlocked: false, progression, unavailable: true as const };
  const inserted = await db.prepare("INSERT OR IGNORE INTO user_mission_hints (user_id,mission_id,hint_level) VALUES (?,?,?)").bind(userId, missionId, hint.level).run();
  if (inserted.meta?.changes !== 1) return { hint, alreadyUnlocked: true, progression: await getUserProgression(userId, now) };
  const deducted = await db.prepare("UPDATE user_resources SET hints=hints-1,hint_updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND hints>0").bind(userId).run();
  if (deducted.meta?.changes !== 1) {
    await db.prepare("DELETE FROM user_mission_hints WHERE user_id=? AND mission_id=? AND hint_level=?").bind(userId, missionId, hint.level).run();
    return { hint: null, alreadyUnlocked: false, progression: await getUserProgression(userId, now), unavailable: true as const };
  }
  await db.prepare(`INSERT INTO mission_performance (user_id,mission_id,hints_used) VALUES (?,?,1)
    ON CONFLICT(user_id,mission_id) DO UPDATE SET hints_used=hints_used+1,updated_at=CURRENT_TIMESTAMP`).bind(userId, missionId).run();
  return { hint, alreadyUnlocked: false, progression: await getUserProgression(userId, now) };
}

export async function getNextHintPreview(userId: string, missionId: number) {
  const effects = await getEffects(userId);
  if (!hasEffect(effects, "intuition")) return null;
  return getDb().prepare(`SELECT hint_type AS type FROM mission_hints WHERE mission_id=? AND hint_level=
    (SELECT COALESCE(MAX(hint_level),0)+1 FROM user_mission_hints WHERE user_id=? AND mission_id=?)`).bind(missionId, userId, missionId).first<{ type: string }>();
}

export async function getMissionReward(userId: string, missionId: number, baseXp: number) {
  const [performance, hints, balance] = await Promise.all([
    getDb().prepare("SELECT errors,attempts FROM mission_performance WHERE user_id=? AND mission_id=?").bind(userId, missionId).first<{ errors: number; attempts: number }>(),
    getDb().prepare("SELECT COUNT(*) AS count FROM user_mission_hints WHERE user_id=? AND mission_id=?").bind(userId, missionId).first<{ count: number }>(),
    getBalance(),
  ]);
  return missionXpReward(baseXp, hints?.count ?? 0, performance?.errors ?? 0, { hintPenaltyPercent: balance.hintPenaltyPercent, minimumPercent: balance.minimumXpPercent });
}

export async function recordMissionPerformance(input: { userId: string; missionId: number; skillId: number; passed: boolean; codeHash: string; sourceCode: string; durationMs: number }) {
  const db = getDb();
  const previous = await db.prepare("SELECT attempts,errors FROM mission_performance WHERE user_id=? AND mission_id=?").bind(input.userId, input.missionId).first<{ attempts: number; errors: number }>();
  const effects = await getEffects(input.userId);
  const skill = await db.prepare("SELECT name FROM skills WHERE id=?").bind(input.skillId).first<{ name: string }>();
  const skillProgress = await db.prepare("SELECT failed_attempts AS failedAttempts FROM user_skill_progress WHERE user_id=? AND skill_id=?").bind(input.userId, input.skillId).first<{ failedAttempts: number }>();
  const battle = await db.prepare("SELECT enemy_name AS enemyName FROM mission_battle_configs WHERE mission_id=?").bind(input.missionId).first<{ enemyName: string }>();
  const errorCount = (previous?.errors ?? 0) + (input.passed ? 0 : 1);
  const guidance = input.passed ? null
    : hasEffect(effects, "bug_reading") && battle?.enemyName.toLowerCase().includes("bug") ? `O problema está provavelmente dentro da parte que aplica ${skill?.name ?? "o conceito atual"}. Delimite essa região antes de editar.`
    : hasEffect(effects, "analyst") && (skillProgress?.failedAttempts ?? 0) + 1 >= 3 ? `Você apresentou dificuldade em ${skill?.name ?? "este assunto"} nas últimas atividades. Considere uma revisão antes de continuar.`
    : hasEffect(effects, "clinical_eye") || (errorCount >= 3 && hasEffect(effects, "investigator")) ? `Este erro parece estar relacionado a ${skill?.name ?? "este conceito"}. Revise esse assunto antes da próxima tentativa.` : null;
  const hints = await db.prepare("SELECT COUNT(*) AS count FROM user_mission_hints WHERE user_id=? AND mission_id=?").bind(input.userId, input.missionId).first<{ count: number }>();
  await db.batch([
    db.prepare(`INSERT INTO mission_performance (user_id,mission_id,attempts,errors,successes,hints_used,completed_without_hints,completed_first_attempt,resolution_ms)
      VALUES (?,?,1,?,?,?, ?,?,?) ON CONFLICT(user_id,mission_id) DO UPDATE SET attempts=attempts+1,
      errors=errors+excluded.errors,successes=successes+excluded.successes,hints_used=MAX(hints_used,excluded.hints_used),
      completed_without_hints=MAX(completed_without_hints,excluded.completed_without_hints),
      completed_first_attempt=MAX(completed_first_attempt,excluded.completed_first_attempt),resolution_ms=resolution_ms+excluded.resolution_ms,updated_at=CURRENT_TIMESTAMP`)
      .bind(input.userId, input.missionId, input.passed ? 0 : 1, input.passed ? 1 : 0, hints?.count ?? 0,
        input.passed && (hints?.count ?? 0) === 0 ? 1 : 0, input.passed && (previous?.attempts ?? 0) === 0 ? 1 : 0, input.durationMs),
    db.prepare(`INSERT INTO mission_attempt_history (user_id,mission_id,passed,code_hash,source_code,explanation) VALUES (?,?,?,?,?,?)`)
      .bind(input.userId, input.missionId, input.passed ? 1 : 0, input.codeHash, hasEffect(effects, "code_memory") ? input.sourceCode : null,
        input.passed ? "Solução aprovada pelos critérios da missão." : guidance ?? "A solução ainda não atende a todos os critérios."),
  ]);
  return { guidance };
}

export type SkillTreeNode = { id: string; name: string; description: string; category: "knowledge" | "resilience" | "strategy"; cost: number; minLevel: number; maxRanks: number; rank: number; icon: string; positionX: number; positionY: number; prerequisites: { id: string; name: string; minimumRank: number; currentRank: number }[] };

export async function getSkillTree(userId: string) {
  const db = getDb();
  const [nodes, prerequisites, progression] = await Promise.all([
    db.prepare(`SELECT sa.id,sa.name,sa.description,sa.category,sa.cost,sa.min_level AS minLevel,sa.max_ranks AS maxRanks,
      sa.icon,sa.position_x AS positionX,sa.position_y AS positionY,COALESCE(ua.rank,0) AS rank
      FROM skill_abilities sa LEFT JOIN user_abilities ua ON ua.skill_id=sa.id AND ua.user_id=? ORDER BY sa.category,sa.sort_order`).bind(userId).all<Omit<SkillTreeNode, "prerequisites">>(),
    db.prepare(`SELECT sap.skill_id AS skillId,sap.prerequisite_skill_id AS id,sa.name,sap.minimum_rank AS minimumRank,
      COALESCE(ua.rank,0) AS currentRank FROM skill_ability_prerequisites sap JOIN skill_abilities sa ON sa.id=sap.prerequisite_skill_id
      LEFT JOIN user_abilities ua ON ua.skill_id=sap.prerequisite_skill_id AND ua.user_id=?`).bind(userId).all<{ skillId: string; id: string; name: string; minimumRank: number; currentRank: number }>(),
    getUserProgression(userId),
  ]);
  return { progression, nodes: nodes.results.map((node) => ({ ...node, prerequisites: prerequisites.results.filter((item) => item.skillId === node.id).map((item) => ({ id: item.id, name: item.name, minimumRank: item.minimumRank, currentRank: item.currentRank })) })) };
}

export async function getCodeMemoryReview(userId: string) {
  if (!hasEffect(await getEffects(userId), "code_memory")) return null;
  const history = await getDb().prepare(`SELECT m.title,mah.passed,mah.source_code AS sourceCode,
    mah.explanation,mah.created_at AS createdAt FROM mission_attempt_history mah
    JOIN missions m ON m.id=mah.mission_id WHERE mah.user_id=? AND mah.source_code IS NOT NULL
    ORDER BY mah.id DESC LIMIT 12`).bind(userId).all<{ title: string; passed: number; sourceCode: string; explanation: string; createdAt: string }>();
  return history.results;
}

export async function purchaseAbility(userId: string, skillId: string) {
  const db = getDb();
  const tree = await getSkillTree(userId);
  const skill = tree.nodes.find((node) => node.id === skillId);
  if (!skill) return { ok: false, message: "Habilidade não encontrada." };
  if (skill.rank >= skill.maxRanks) return { ok: false, message: "Habilidade já adquirida." };
  if (tree.progression.level < skill.minLevel) return { ok: false, message: `Requer nível ${skill.minLevel}.` };
  if (skill.prerequisites.some((item) => item.currentRank < item.minimumRank)) return { ok: false, message: "Conclua o pré-requisito primeiro." };
  if (tree.progression.skillPoints < skill.cost) return { ok: false, message: "Pontos de habilidade insuficientes." };
  const nextRank = skill.rank + 1;
  const purchase = await db.prepare("INSERT OR IGNORE INTO user_ability_purchases (user_id,skill_id,rank,cost) VALUES (?,?,?,?)").bind(userId, skillId, nextRank, skill.cost).run();
  if (purchase.meta?.changes !== 1) return { ok: false, message: "Habilidade já adquirida." };
  const spent = await db.prepare(`UPDATE profiles SET skill_points_spent=skill_points_spent+?,updated_at=CURRENT_TIMESTAMP
    WHERE user_id=? AND skill_points_earned-skill_points_spent>=?`).bind(skill.cost, userId, skill.cost).run();
  if (spent.meta?.changes !== 1) {
    await db.prepare("DELETE FROM user_ability_purchases WHERE user_id=? AND skill_id=? AND rank=?").bind(userId, skillId, nextRank).run();
    return { ok: false, message: "Pontos de habilidade insuficientes." };
  }
  await db.prepare(`INSERT INTO user_abilities (user_id,skill_id,rank) VALUES (?,?,?)
    ON CONFLICT(user_id,skill_id) DO UPDATE SET rank=excluded.rank`).bind(userId, skillId, nextRank).run();
  return { ok: true, message: `${skill.name} adquirida.`, progression: await getUserProgression(userId) };
}
