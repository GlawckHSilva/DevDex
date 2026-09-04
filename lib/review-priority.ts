import type { MasteryState } from "./mastery";

export type ReviewPriorityLevel = "none" | "low" | "medium" | "high";
export type ReviewType = "quick" | "practice" | "error" | "mastery";
export type ReviewReason =
  | "low_mastery"
  | "recent_errors"
  | "stale_practice"
  | "hints"
  | "boss_difficulty"
  | "prerequisite"
  | "failed_review"
  | "recent_success";

export type ReviewPriorityInput = {
  hasPractice: boolean;
  masteryPercent: number;
  masteryState: MasteryState;
  recentErrors: number;
  recentAttempts: number;
  recentSuccesses: number;
  hintsUsed: number;
  daysSinceLastPractice: number | null;
  daysSinceLastReview: number | null;
  reviewSuccessRate: number | null;
  reviewAttempts: number;
  conceptImportance: number;
  prerequisiteWeight: number;
  bossDifficulty: number;
};

export type ReviewPriorityResult = {
  score: number;
  priority: ReviewPriorityLevel;
  reviewType: ReviewType;
  reasons: ReviewReason[];
  factors: Record<string, number>;
};

export const reviewPriorityConfig = {
  maxPrimaryRecommendations: 3,
  maxLibraryRecommendations: 6,
  recentWindowDays: 14,
  stalePracticeDays: 21,
  freshPracticeDays: 2,
  reviewCooldownDays: 3,
  priority: { high: 70, medium: 45, low: 25 },
};

export function reviewPriority(input: ReviewPriorityInput): ReviewPriorityResult {
  if (!input.hasPractice) return emptyPriority();

  const recentCleanReview = input.daysSinceLastReview !== null
    && input.daysSinceLastReview <= reviewPriorityConfig.reviewCooldownDays
    && (input.reviewSuccessRate ?? 0) >= 0.7
    && input.recentErrors === 0;
  if (recentCleanReview) return { ...emptyPriority(), reasons: ["recent_success"] };

  const factors: ReviewPriorityResult["factors"] = {
    mastery: masteryFactor(input.masteryPercent),
    recentErrors: Math.min(42, input.recentErrors * 16),
    recentAttempts: input.recentAttempts >= 3 && (input.recentSuccesses === 0 || input.recentErrors >= 2) ? 10 : 0,
    stalePractice: stalePracticeFactor(input.daysSinceLastPractice, input.recentErrors),
    hints: Math.min(12, input.hintsUsed * 4),
    bossDifficulty: Math.min(24, input.bossDifficulty * 20),
    failedReview: input.reviewAttempts > 0 && (input.reviewSuccessRate ?? 1) < 0.5 ? 30 : 0,
    prerequisite: Math.min(14, input.conceptImportance + input.prerequisiteWeight),
    firstAttempt: input.reviewAttempts === 0 && input.recentAttempts > 0 && input.recentSuccesses === input.recentAttempts && input.masteryPercent >= 50 ? -12 : 0,
    freshPractice: input.daysSinceLastPractice !== null && input.daysSinceLastPractice <= reviewPriorityConfig.freshPracticeDays && input.recentErrors === 0 ? -18 : 0,
  };

  const score = Math.max(0, Math.min(100, Math.round(Object.values(factors).reduce((sum, value) => sum + value, 0))));
  const reasons = reasonsFromFactors(factors);
  const priority = score >= reviewPriorityConfig.priority.high ? "high" : score >= reviewPriorityConfig.priority.medium ? "medium" : score >= reviewPriorityConfig.priority.low ? "low" : "none";
  return { score, priority, reviewType: reviewType(input, reasons), reasons, factors };
}

export function compareReviewPriority(a: ReviewPriorityResult, b: ReviewPriorityResult) {
  const rank: Record<ReviewPriorityLevel, number> = { none: 0, low: 1, medium: 2, high: 3 };
  return rank[b.priority] - rank[a.priority] || b.score - a.score;
}

function masteryFactor(mastery: number) {
  if (mastery < 30) return 44;
  if (mastery < 50) return 26;
  if (mastery < 75) return 14;
  return 0;
}

function stalePracticeFactor(days: number | null, recentErrors: number) {
  if (days === null || days < reviewPriorityConfig.stalePracticeDays || recentErrors > 0) return 0;
  return Math.min(28, 24 + Math.floor((days - reviewPriorityConfig.stalePracticeDays) / 7) * 4);
}

function reasonsFromFactors(factors: Record<string, number>): ReviewReason[] {
  const reasons: ReviewReason[] = [];
  if (factors.mastery > 0) reasons.push("low_mastery");
  if (factors.recentErrors > 0 || factors.recentAttempts > 0) reasons.push("recent_errors");
  if (factors.stalePractice > 0) reasons.push("stale_practice");
  if (factors.hints > 0) reasons.push("hints");
  if (factors.bossDifficulty > 0) reasons.push("boss_difficulty");
  if (factors.failedReview > 0) reasons.push("failed_review");
  if (factors.prerequisite > 0) reasons.push("prerequisite");
  return reasons;
}

function reviewType(input: ReviewPriorityInput, reasons: ReviewReason[]): ReviewType {
  if (reasons.includes("recent_errors") || reasons.includes("boss_difficulty") || reasons.includes("failed_review")) return "error";
  if (input.masteryPercent < 75) return "practice";
  if (reasons.includes("stale_practice")) return "quick";
  return "mastery";
}

function emptyPriority(): ReviewPriorityResult {
  return { score: 0, priority: "none", reviewType: "quick", reasons: [], factors: {} };
}
