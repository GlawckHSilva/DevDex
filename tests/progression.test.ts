import assert from "node:assert/strict";
import test from "node:test";
import { levelFromXp, missionXpReward, regenerateResource, xpForLevel, xpProgress } from "../lib/progression";

test("usa curva progressiva de XP sem tabela hardcoded", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(xpForLevel), [0, 100, 250, 450, 700]);
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(249), 2);
  assert.equal(levelFromXp(250), 3);
  assert.deepEqual(xpProgress(175), { level: 2, totalXp: 175, withinLevel: 75, required: 150, nextLevelXp: 250, percent: 50 });
});

test("preserva XP excedente e permite múltiplos níveis", () => {
  const progress = xpProgress(1_500);
  assert.equal(progress.level, 7);
  assert.equal(progress.withinLevel, 150);
  assert.equal(progress.nextLevelXp, 1_750);
});

test("regenera corações offline sem ultrapassar o máximo", () => {
  const start = new Date("2026-09-01T14:00:00Z");
  const partial = regenerateResource(2, 5, start, new Date("2026-09-01T16:30:00Z"), 60);
  assert.equal(partial.value, 4);
  assert.equal(partial.nextAt?.toISOString(), "2026-09-01T17:00:00.000Z");
  const full = regenerateResource(2, 5, start, new Date("2026-09-01T18:00:00Z"), 60);
  assert.equal(full.value, 5);
  assert.equal(full.nextAt, null);
});

test("regenera dicas em cinco horas e respeita modificadores", () => {
  const start = new Date("2026-09-01T00:00:00Z");
  assert.equal(regenerateResource(0, 3, start, new Date("2026-09-01T10:00:00Z"), 300).value, 2);
  assert.equal(regenerateResource(0, 3, start, new Date("2026-09-01T08:00:00Z"), 240).value, 2);
  assert.equal(regenerateResource(2, 3, start, new Date("2026-09-03T00:00:00Z"), 300).value, 3);
});

test("balanceia bônus de desempenho e penalidade configurável de dicas", () => {
  assert.deepEqual(missionXpReward(100, 0, 0), { amount: 115, percent: 115, flawless: true, noHints: true });
  assert.equal(missionXpReward(100, 1, 0).amount, 95);
  assert.equal(missionXpReward(100, 3, 2).amount, 70);
  assert.equal(missionXpReward(100, 10, 2).amount, 70);
});
