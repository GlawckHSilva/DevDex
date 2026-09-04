import { masteryState, type MasteryState } from "@/lib/mastery";
import { compareReviewPriority, reviewPriority, reviewPriorityConfig, type ReviewPriorityLevel, type ReviewReason, type ReviewType } from "@/lib/review-priority";
import { getDb } from "./client";

type ReviewCandidateRow = {
  id: number;
  slug: string;
  title: string;
  description: string;
  technologyName: string;
  technologySlug: string;
  pathName: string;
  zoneTitle: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | "professional";
  missionSlug: string | null;
  favorite: number;
  skillId: number | null;
  skillName: string | null;
  masteryPercent: number;
  successfulAttempts: number;
  failedAttempts: number;
  reviewCorrectAnswers: number;
  reviewIncorrectAnswers: number;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  lessonCompletedAt: string | null;
  missionAttempts: number;
  missionSuccesses: number;
  hintsUsed: number;
  firstAttemptSuccesses: number;
  recentAttempts: number;
  recentErrors: number;
  recentSuccesses: number;
  lastPracticeAt: string | null;
  bossDifficulty: number;
  prerequisiteForCount: number;
  relatedActivities: number;
};

export type UserReviewRecommendation = {
  id: number;
  slug: string;
  title: string;
  description: string;
  technologyName: string;
  technologySlug: string;
  pathName: string;
  zoneTitle: string | null;
  difficulty: ReviewCandidateRow["difficulty"];
  missionSlug: string | null;
  favorite: number;
  skillId: number | null;
  skillName: string | null;
  masteryPercent: number;
  masteryState: MasteryState;
  score: number;
  priority: Exclude<ReviewPriorityLevel, "none">;
  reviewType: ReviewType;
  reasons: ReviewReason[];
  factors: Record<string, number>;
  reviewReason: string;
  reviewLabel: string;
  dueAt: string | null;
  lastPracticeAt: string | null;
};

export async function getUserReviewRecommendations(userId: string, options: { limit?: number } = {}): Promise<UserReviewRecommendation[]> {
  const limit = options.limit ?? reviewPriorityConfig.maxLibraryRecommendations;
  const rows = await getDb().prepare(`SELECT ec.id,ec.slug,ec.title,ec.description,t.name AS technologyName,t.slug AS technologySlug,
    lp.name AS pathName,cz.title AS zoneTitle,ec.difficulty,m.slug AS missionSlug,
    CASE WHEN f.content_id IS NULL THEN 0 ELSE 1 END AS favorite,
    ec.skill_id AS skillId,s.name AS skillName,COALESCE(usp.mastery,0) AS masteryPercent,
    COALESCE(usp.successful_attempts,0) AS successfulAttempts,COALESCE(usp.failed_attempts,0) AS failedAttempts,
    COALESCE(r.correct_answers,0) AS reviewCorrectAnswers,COALESCE(r.incorrect_answers,0) AS reviewIncorrectAnswers,
    r.next_review_at AS nextReviewAt,r.last_reviewed_at AS lastReviewedAt,
    COALESCE(h.view_count,0) AS viewCount,h.last_viewed_at AS lastViewedAt,ul.completed_at AS lessonCompletedAt,
    COALESCE((SELECT SUM(mp.attempts) FROM mission_performance mp JOIN missions sm ON sm.id=mp.mission_id WHERE mp.user_id=? AND sm.skill_id=ec.skill_id),0) AS missionAttempts,
    COALESCE((SELECT SUM(mp.successes) FROM mission_performance mp JOIN missions sm ON sm.id=mp.mission_id WHERE mp.user_id=? AND sm.skill_id=ec.skill_id),0) AS missionSuccesses,
    COALESCE((SELECT SUM(mp.hints_used) FROM mission_performance mp JOIN missions sm ON sm.id=mp.mission_id WHERE mp.user_id=? AND sm.skill_id=ec.skill_id),0) AS hintsUsed,
    COALESCE((SELECT SUM(mp.completed_first_attempt) FROM mission_performance mp JOIN missions sm ON sm.id=mp.mission_id WHERE mp.user_id=? AND sm.skill_id=ec.skill_id),0) AS firstAttemptSuccesses,
    (SELECT COUNT(*) FROM mission_attempt_history mah JOIN missions sm ON sm.id=mah.mission_id WHERE mah.user_id=? AND sm.skill_id=ec.skill_id AND mah.created_at>=datetime('now','-14 days')) AS recentAttempts,
    (SELECT COUNT(*) FROM mission_attempt_history mah JOIN missions sm ON sm.id=mah.mission_id WHERE mah.user_id=? AND sm.skill_id=ec.skill_id AND mah.passed=0 AND mah.created_at>=datetime('now','-14 days')) AS recentErrors,
    (SELECT COUNT(*) FROM mission_attempt_history mah JOIN missions sm ON sm.id=mah.mission_id WHERE mah.user_id=? AND sm.skill_id=ec.skill_id AND mah.passed=1 AND mah.created_at>=datetime('now','-14 days')) AS recentSuccesses,
    (SELECT MAX(mah.created_at) FROM mission_attempt_history mah JOIN missions sm ON sm.id=mah.mission_id WHERE mah.user_id=? AND sm.skill_id=ec.skill_id) AS lastPracticeAt,
    (SELECT COUNT(*) FROM mission_attempt_history mah JOIN missions sm ON sm.id=mah.mission_id JOIN mission_battle_configs mbc ON mbc.mission_id=sm.id
      WHERE mah.user_id=? AND sm.skill_id=ec.skill_id AND mah.passed=0 AND mbc.enemy_type IN ('elite','boss') AND mah.created_at>=datetime('now','-14 days')) AS bossDifficulty,
    (SELECT COUNT(*) FROM content_prerequisites cp WHERE cp.prerequisite_content_id=ec.id) AS prerequisiteForCount,
    (SELECT COUNT(*) FROM missions sm WHERE sm.skill_id=ec.skill_id AND sm.status='published') AS relatedActivities
    FROM educational_contents ec JOIN technologies t ON t.id=ec.technology_id
    JOIN learning_paths lp ON lp.id=ec.learning_path_id LEFT JOIN campaign_zones cz ON cz.id=ec.zone_id
    LEFT JOIN missions m ON m.id=ec.related_mission_id LEFT JOIN skills s ON s.id=ec.skill_id
    LEFT JOIN user_content_favorites f ON f.content_id=ec.id AND f.user_id=?
    LEFT JOIN user_skill_progress usp ON usp.skill_id=ec.skill_id AND usp.user_id=?
    LEFT JOIN user_content_reviews r ON r.content_id=ec.id AND r.user_id=?
    LEFT JOIN user_content_history h ON h.content_id=ec.id AND h.user_id=?
    LEFT JOIN user_lessons ul ON ul.lesson_id=ec.lesson_id AND ul.user_id=?
    WHERE ec.status='published' AND ec.skill_id IS NOT NULL
    ORDER BY t.name,lp.id,ec.sort_order`)
    .bind(userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId, userId)
    .all<ReviewCandidateRow>();

  return rows.results.map(toRecommendation).filter((item): item is UserReviewRecommendation => Boolean(item))
    .sort((a, b) => compareReviewPriority(a, b) || a.title.localeCompare(b.title)).slice(0, limit);
}

function toRecommendation(row: ReviewCandidateRow): UserReviewRecommendation | null {
  const lastPracticeAt = latestDate(row.lastPracticeAt, row.lastViewedAt, row.lessonCompletedAt);
  const reviewAttempts = row.reviewCorrectAnswers + row.reviewIncorrectAnswers;
  const reviewSuccessRate = reviewAttempts ? row.reviewCorrectAnswers / reviewAttempts : null;
  const state = masteryState(row.masteryPercent);
  const result = reviewPriority({
    hasPractice: row.successfulAttempts + row.failedAttempts + row.viewCount + reviewAttempts + row.missionAttempts > 0 || Boolean(row.lessonCompletedAt),
    masteryPercent: row.masteryPercent,
    masteryState: state,
    recentErrors: row.recentErrors,
    recentAttempts: row.recentAttempts,
    recentSuccesses: row.recentSuccesses,
    hintsUsed: row.hintsUsed,
    daysSinceLastPractice: daysSince(lastPracticeAt),
    daysSinceLastReview: daysSince(row.lastReviewedAt),
    reviewSuccessRate,
    reviewAttempts,
    conceptImportance: importance(row.difficulty, row.relatedActivities),
    prerequisiteWeight: Math.min(8, row.prerequisiteForCount * 2),
    bossDifficulty: row.bossDifficulty,
  });
  if (result.priority === "none") return null;
  return {
    ...row,
    masteryState: state,
    score: result.score,
    priority: result.priority,
    reviewType: result.reviewType,
    reasons: result.reasons,
    factors: result.factors,
    reviewReason: reviewReasonText(row, result.reasons, daysSince(lastPracticeAt)),
    reviewLabel: reviewLabel(result.reviewType),
    dueAt: row.nextReviewAt,
    lastPracticeAt,
  };
}

function latestDate(...values: Array<string | null>) {
  return values.filter(Boolean).sort((a, b) => (parseD1Date(b)?.getTime() ?? 0) - (parseD1Date(a)?.getTime() ?? 0))[0] ?? null;
}

function daysSince(value: string | null) {
  const date = parseD1Date(value);
  return date ? Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000)) : null;
}

function parseD1Date(value: string | null) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function importance(difficulty: ReviewCandidateRow["difficulty"], relatedActivities: number) {
  const base = { beginner: 2, intermediate: 3, advanced: 5, professional: 6 }[difficulty];
  return Math.min(6, base + Math.floor(relatedActivities / 8));
}

function reviewLabel(type: ReviewType) {
  return ({ quick: "REVISÃO RÁPIDA", practice: "REVISÃO PRÁTICA", error: "REVISÃO DE ERRO", mastery: "REVISÃO DE DOMÍNIO" } as Record<ReviewType, string>)[type];
}

function reviewReasonText(row: ReviewCandidateRow, reasons: ReviewReason[], days: number | null) {
  if (reasons.includes("boss_difficulty")) return `Você teve dificuldade em uma Elite ou Boss ligado a ${row.skillName ?? row.title}.`;
  if (reasons.includes("recent_errors") && reasons.includes("low_mastery")) return `Sua maestria está baixa e você errou ${row.skillName ?? row.title} recentemente.`;
  if (reasons.includes("recent_errors")) return `Você teve dificuldade com ${row.skillName ?? row.title} nas últimas atividades.`;
  if (reasons.includes("failed_review")) return `A última revisão ainda indicou dificuldade neste conteúdo.`;
  if (reasons.includes("hints")) return `Você concluiu atividades com ajuda de dicas; uma revisão fortalece a independência.`;
  if (reasons.includes("stale_practice") && days !== null) return `Você domina este assunto, mas não o pratica há ${days} dias.`;
  if (reasons.includes("low_mastery")) return `Sua maestria em ${row.skillName ?? row.title} ainda está em construção.`;
  if (reasons.includes("prerequisite")) return `Este conceito sustenta próximos conteúdos da trilha.`;
  return "Uma revisão curta pode fortalecer este ponto antes de avançar.";
}
