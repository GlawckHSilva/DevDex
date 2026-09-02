export type ResourceRegeneration = { value: number; updatedAt: Date; nextAt: Date | null };

const ACCELERATED_LEVELS = 8;
const MAX_LEVEL_STEP_XP = 500;

export function xpForLevel(level: number) {
  const steps = Math.max(0, Math.floor(level) - 1);
  const accelerated = Math.min(steps, ACCELERATED_LEVELS);
  return 25 * accelerated * (accelerated + 3) + Math.max(0, steps - ACCELERATED_LEVELS) * MAX_LEVEL_STEP_XP;
}

export function levelFromXp(totalXp: number) {
  const xp = Math.max(0, Math.floor(totalXp));
  if (xp >= xpForLevel(ACCELERATED_LEVELS + 1)) {
    return ACCELERATED_LEVELS + 1 + Math.floor((xp - xpForLevel(ACCELERATED_LEVELS + 1)) / MAX_LEVEL_STEP_XP);
  }
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level += 1;
  return level;
}

export function xpProgress(totalXp: number) {
  const level = levelFromXp(totalXp);
  const levelStart = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const withinLevel = Math.max(0, totalXp - levelStart);
  const required = nextLevelXp - levelStart;
  return { level, totalXp, withinLevel, required, nextLevelXp, percent: Math.min(100, Math.round(withinLevel / required * 100)) };
}

export function regenerateResource(value: number, max: number, updatedAt: Date, now: Date, intervalMinutes: number): ResourceRegeneration {
  if (value >= max) return { value: max, updatedAt: now, nextAt: null };
  const intervalMs = Math.max(1, intervalMinutes) * 60_000;
  const elapsed = Math.max(0, now.getTime() - updatedAt.getTime());
  const recovered = Math.floor(elapsed / intervalMs);
  const nextValue = Math.min(max, value + recovered);
  const nextUpdatedAt = recovered > 0 ? new Date(updatedAt.getTime() + recovered * intervalMs) : updatedAt;
  return { value: nextValue, updatedAt: nextValue >= max ? now : nextUpdatedAt, nextAt: nextValue >= max ? null : new Date(nextUpdatedAt.getTime() + intervalMs) };
}

export function missionXpReward(baseXp: number, hintsUsed: number, errors: number, settings = { hintPenaltyPercent: 10, minimumPercent: 70 }) {
  const hintPercent = Math.max(settings.minimumPercent, 100 - Math.max(0, hintsUsed) * settings.hintPenaltyPercent);
  const flawless = errors === 0;
  const noHints = hintsUsed === 0;
  const bonusPercent = (flawless ? 5 : 0) + (noHints ? 5 : 0) + (flawless && noHints ? 5 : 0);
  const percent = hintPercent + bonusPercent;
  return { amount: Math.max(0, Math.round(baseXp * percent / 100)), percent, flawless, noHints };
}
