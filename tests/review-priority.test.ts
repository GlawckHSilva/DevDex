import assert from "node:assert/strict";
import test from "node:test";
import { calculateSkillMastery } from "../lib/mastery";
import { compareReviewPriority, reviewPriority, type ReviewPriorityInput } from "../lib/review-priority";

const base: ReviewPriorityInput = {
  hasPractice: true,
  masteryPercent: 82,
  masteryState: "Proficiente",
  recentErrors: 0,
  recentAttempts: 1,
  recentSuccesses: 1,
  hintsUsed: 0,
  daysSinceLastPractice: 4,
  daysSinceLastReview: null,
  reviewSuccessRate: null,
  reviewAttempts: 0,
  conceptImportance: 2,
  prerequisiteWeight: 0,
  bossDifficulty: 0,
};

test("usuário novo e conceito nunca estudado não entram em revisão", () => {
  const result = reviewPriority({ ...base, hasPractice: false, masteryPercent: 0, masteryState: "Novo", recentAttempts: 0, recentSuccesses: 0 });
  assert.equal(result.priority, "none");
  assert.equal(result.score, 0);
});

test("maestria baixa em conceito praticado aparece na fila", () => {
  const result = reviewPriority({ ...base, masteryPercent: 28, masteryState: "Familiar", recentAttempts: 0, recentSuccesses: 0 });
  assert.equal(result.priority, "medium");
  assert.ok(result.reasons.includes("low_mastery"));
});

test("maestria alta com prática recente não aparece", () => {
  const result = reviewPriority({ ...base, masteryPercent: 88, masteryState: "Proficiente", daysSinceLastPractice: 1 });
  assert.equal(result.priority, "none");
});

test("maestria alta com longo período sem prática vira revisão preventiva", () => {
  const result = reviewPriority({ ...base, masteryPercent: 88, masteryState: "Proficiente", daysSinceLastPractice: 32, recentAttempts: 0, recentSuccesses: 0 });
  assert.equal(result.priority, "low");
  assert.equal(result.reviewType, "quick");
  assert.ok(result.reasons.includes("stale_practice"));
});

test("erros recentes aumentam prioridade e erros antigos não pesam", () => {
  const oldErrors = reviewPriority({ ...base, masteryPercent: 64, masteryState: "Competente", recentAttempts: 0, recentSuccesses: 0 });
  const recentErrors = reviewPriority({ ...base, masteryPercent: 64, masteryState: "Competente", recentErrors: 3, recentAttempts: 5, recentSuccesses: 2, hintsUsed: 1 });
  assert.equal(oldErrors.priority, "none");
  assert.equal(recentErrors.priority, "high");
  assert.ok(recentErrors.score > oldErrors.score);
});

test("muitas dicas elevam moderadamente a necessidade de revisão", () => {
  const noHints = reviewPriority({ ...base, masteryPercent: 68, masteryState: "Competente", recentAttempts: 2, recentSuccesses: 1, hintsUsed: 0 });
  const withHints = reviewPriority({ ...base, masteryPercent: 68, masteryState: "Competente", recentAttempts: 2, recentSuccesses: 1, hintsUsed: 3 });
  assert.equal(withHints.priority, "low");
  assert.ok(withHints.score > noHints.score);
  assert.ok(withHints.reasons.includes("hints"));
});

test("primeira tentativa consistente reduz prioridade sem bloquear revisão preventiva", () => {
  const result = reviewPriority({ ...base, masteryPercent: 70, masteryState: "Competente", recentAttempts: 3, recentSuccesses: 3, daysSinceLastPractice: 4 });
  assert.equal(result.priority, "none");
  assert.ok(result.factors.firstAttempt < 0);
});

test("dificuldade em Boss ou Elite prioriza o conceito relacionado", () => {
  const result = reviewPriority({ ...base, masteryPercent: 64, masteryState: "Competente", recentErrors: 2, recentAttempts: 3, recentSuccesses: 0, bossDifficulty: 1 });
  assert.equal(result.priority, "high");
  assert.ok(result.reasons.includes("boss_difficulty"));
});

test("revisão concluída com sucesso sai da fila e revisão com erro permanece", () => {
  const success = reviewPriority({ ...base, daysSinceLastReview: 1, reviewAttempts: 2, reviewSuccessRate: 1 });
  const failed = reviewPriority({ ...base, daysSinceLastReview: 1, reviewAttempts: 2, reviewSuccessRate: 0.25 });
  assert.equal(success.priority, "none");
  assert.equal(failed.priority, "low");
  assert.ok(failed.reasons.includes("failed_review"));
});

test("ordenação coloca alta prioridade antes de baixa e respeita limite", () => {
  const low = reviewPriority({ ...base, masteryPercent: 88, masteryState: "Proficiente", daysSinceLastPractice: 32, recentAttempts: 0, recentSuccesses: 0 });
  const high = reviewPriority({ ...base, masteryPercent: 41, masteryState: "Familiar", recentErrors: 2, recentAttempts: 4, recentSuccesses: 1 });
  const sorted = [low, high, reviewPriority({ ...base, hasPractice: false })].sort(compareReviewPriority).slice(0, 2);
  assert.deepEqual(sorted.map((item) => item.priority), ["high", "low"]);
});

test("revisão usa a fórmula central de maestria sem conceder domínio artificial", () => {
  const next = calculateSkillMastery({ currentMastery: 40, passed: true, attempts: 2, errors: 1, hintsUsed: 0, completedWithoutHints: true, completedFirstAttempt: false, reviewCorrectAnswers: 1, reviewIncorrectAnswers: 1 });
  assert.ok(next > 40);
  assert.ok(next < 75);
});
