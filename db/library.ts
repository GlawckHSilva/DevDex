import { calculateSkillMastery } from "@/lib/mastery";
import { getDb } from "./client";
import type { StudyLessonBody } from "./index";
import { getUserReviewRecommendations, type UserReviewRecommendation } from "./reviews";

export type LibraryCard = {
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
};

export type LibraryTechnology = { slug: string; name: string; contentCount: number };
export type LibraryReviewCard = UserReviewRecommendation;
export type LibraryOverview = { contents: LibraryCard[]; technologies: LibraryTechnology[]; recent: LibraryCard[]; reviews: LibraryReviewCard[]; favoriteCount: number };
export type LibraryExample = { title: string; code: string; explanation: string; exampleType: string };
export type LibrarySnippet = { title: string; language: string; code: string; explanation: string };
export type LibraryQuiz = { question: string; options: string[] };
export type LibraryContent = LibraryCard & {
  contentType: string;
  theory: string;
  syntax: string;
  returnDescription: string;
  whenToUse: string;
  commonMistakes: string[];
  comparisons: string[];
  tags: string[];
  quiz: LibraryQuiz | null;
  lessonBody: StudyLessonBody | null;
  pathSlug: string;
  examples: LibraryExample[];
  snippets: LibrarySnippet[];
  prerequisites: Pick<LibraryCard, "slug" | "title" | "technologyName">[];
};

const cardSelect = `ec.id,ec.slug,ec.title,ec.description,t.name AS technologyName,t.slug AS technologySlug,
  lp.name AS pathName,cz.title AS zoneTitle,ec.difficulty,m.slug AS missionSlug,
  CASE WHEN f.content_id IS NULL THEN 0 ELSE 1 END AS favorite`;

export async function getLibraryOverview(userId: string, query = "", technology = "", favoritesOnly = false): Promise<LibraryOverview> {
  const db = getDb();
  const normalizedQuery = query.trim().slice(0, 100);
  const normalizedTechnology = technology.trim().slice(0, 60);
  const [contents, technologies, recent, reviews, favoriteCount] = await Promise.all([
    db.prepare(`SELECT ${cardSelect} FROM educational_contents ec
      JOIN technologies t ON t.id=ec.technology_id JOIN learning_paths lp ON lp.id=ec.learning_path_id
      LEFT JOIN campaign_zones cz ON cz.id=ec.zone_id LEFT JOIN missions m ON m.id=ec.related_mission_id
      LEFT JOIN user_content_favorites f ON f.content_id=ec.id AND f.user_id=?
      WHERE ec.status='published' AND (?='' OR t.slug=?) AND (?=0 OR f.content_id IS NOT NULL)
      AND (?='' OR lower(ec.title||' '||ec.description||' '||ec.theory||' '||ec.syntax||' '||ec.tags_json||' '||t.name||' '||lp.name) LIKE '%'||lower(?)||'%')
      ORDER BY t.name,ec.sort_order LIMIT 80`).bind(userId, normalizedTechnology, normalizedTechnology, favoritesOnly ? 1 : 0, normalizedQuery, normalizedQuery).all<LibraryCard>(),
    db.prepare(`SELECT t.slug,t.name,COUNT(ec.id) AS contentCount FROM technologies t
      JOIN educational_contents ec ON ec.technology_id=t.id AND ec.status='published'
      GROUP BY t.id ORDER BY MIN(ec.sort_order),t.name`).all<LibraryTechnology>(),
    db.prepare(`SELECT ${cardSelect} FROM user_content_history h JOIN educational_contents ec ON ec.id=h.content_id
      JOIN technologies t ON t.id=ec.technology_id JOIN learning_paths lp ON lp.id=ec.learning_path_id
      LEFT JOIN campaign_zones cz ON cz.id=ec.zone_id LEFT JOIN missions m ON m.id=ec.related_mission_id
      LEFT JOIN user_content_favorites f ON f.content_id=ec.id AND f.user_id=?
      WHERE h.user_id=? AND ec.status='published' ORDER BY h.last_viewed_at DESC LIMIT 6`).bind(userId, userId).all<LibraryCard>(),
    getUserReviewRecommendations(userId),
    db.prepare("SELECT COUNT(*) AS count FROM user_content_favorites WHERE user_id=?").bind(userId).first<{ count: number }>(),
  ]);
  return { contents: contents.results, technologies: technologies.results, recent: recent.results, reviews, favoriteCount: favoriteCount?.count ?? 0 };
}

export async function getLibraryContent(userId: string, slug: string): Promise<LibraryContent | null> {
  const db = getDb();
  const content = await db.prepare(`SELECT ${cardSelect},ec.content_type AS contentType,ec.theory,ec.syntax,
    ec.return_description AS returnDescription,ec.when_to_use AS whenToUse,ec.common_mistakes_json AS commonMistakesJson,
    ec.comparisons_json AS comparisonsJson,ec.tags_json AS tagsJson,ec.quiz_json AS quizJson,l.body_json AS lessonBodyJson,lp.slug AS pathSlug
    FROM educational_contents ec JOIN technologies t ON t.id=ec.technology_id JOIN learning_paths lp ON lp.id=ec.learning_path_id
    LEFT JOIN campaign_zones cz ON cz.id=ec.zone_id LEFT JOIN missions m ON m.id=ec.related_mission_id
    LEFT JOIN lessons l ON l.id=ec.lesson_id LEFT JOIN user_content_favorites f ON f.content_id=ec.id AND f.user_id=?
    WHERE ec.slug=? AND ec.status='published'`).bind(userId, slug).first<LibraryCard & {
      contentType: string; theory: string; syntax: string; returnDescription: string; whenToUse: string;
      commonMistakesJson: string; comparisonsJson: string; tagsJson: string; quizJson: string; lessonBodyJson: string | null; pathSlug: string;
    }>();
  if (!content) return null;
  const [examples, snippets, prerequisites] = await Promise.all([
    db.prepare(`SELECT title,code,explanation,example_type AS exampleType FROM content_examples
      WHERE content_id=? ORDER BY sort_order`).bind(content.id).all<LibraryExample>(),
    db.prepare(`SELECT title,language,code,explanation FROM content_snippets
      WHERE content_id=? ORDER BY sort_order`).bind(content.id).all<LibrarySnippet>(),
    db.prepare(`SELECT p.slug,p.title,t.name AS technologyName FROM content_prerequisites cp
      JOIN educational_contents p ON p.id=cp.prerequisite_content_id JOIN technologies t ON t.id=p.technology_id
      WHERE cp.content_id=? AND p.status='published' ORDER BY p.sort_order`).bind(content.id).all<Pick<LibraryCard, "slug" | "title" | "technologyName">>(),
  ]);
  const { commonMistakesJson, comparisonsJson, tagsJson, quizJson, lessonBodyJson, ...base } = content;
  return {
    ...base,
    commonMistakes: parseList(commonMistakesJson),
    comparisons: parseList(comparisonsJson),
    tags: parseList(tagsJson),
    quiz: parseQuiz(quizJson),
    lessonBody: lessonBodyJson ? JSON.parse(lessonBodyJson) as StudyLessonBody : null,
    examples: examples.results,
    snippets: snippets.results,
    prerequisites: prerequisites.results,
  };
}

export async function recordContentView(userId: string, contentId: number) {
  await getDb().prepare(`INSERT INTO user_content_history (user_id,content_id) VALUES (?,?)
    ON CONFLICT(user_id,content_id) DO UPDATE SET view_count=view_count+1,last_viewed_at=CURRENT_TIMESTAMP`).bind(userId, contentId).run();
}

export async function toggleContentFavorite(userId: string, contentId: number) {
  const db = getDb();
  const existing = await db.prepare("SELECT 1 AS found FROM user_content_favorites WHERE user_id=? AND content_id=?").bind(userId, contentId).first<{ found: number }>();
  if (existing) await db.prepare("DELETE FROM user_content_favorites WHERE user_id=? AND content_id=?").bind(userId, contentId).run();
  else await db.prepare("INSERT INTO user_content_favorites (user_id,content_id) VALUES (?,?)").bind(userId, contentId).run();
  return !existing;
}

export async function answerContentQuiz(userId: string, contentId: number, answer: number) {
  const db = getDb();
  const content = await db.prepare("SELECT quiz_json AS quizJson,skill_id AS skillId FROM educational_contents WHERE id=? AND status='published'").bind(contentId).first<{ quizJson: string; skillId: number | null }>();
  const quiz = content ? parseStoredQuiz(content.quizJson) : null;
  if (!content || !quiz || !Number.isInteger(answer) || answer < 0 || answer >= quiz.options.length) return null;
  const previous = await db.prepare(`SELECT correct_answers AS correctAnswers,incorrect_answers AS incorrectAnswers,interval_days AS intervalDays
    FROM user_content_reviews WHERE user_id=? AND content_id=?`).bind(userId, contentId).first<{ correctAnswers: number; incorrectAnswers: number; intervalDays: number }>();
  const correct = answer === quiz.correctIndex;
  const nextCorrectAnswers = (previous?.correctAnswers ?? 0) + (correct ? 1 : 0);
  const nextIncorrectAnswers = (previous?.incorrectAnswers ?? 0) + (correct ? 0 : 1);
  const intervalDays = correct ? previous?.correctAnswers ? Math.min(30, Math.max(3, previous.intervalDays * 2)) : 1 : 1;
  const nextReviewAt = new Date(Date.now() + intervalDays * 86_400_000).toISOString();
  await db.prepare(`INSERT INTO user_content_reviews
    (user_id,content_id,correct_answers,incorrect_answers,interval_days,next_review_at,last_reviewed_at)
    VALUES (?,?,?, ?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id,content_id) DO UPDATE SET
      correct_answers=correct_answers+excluded.correct_answers,
      incorrect_answers=incorrect_answers+excluded.incorrect_answers,
      interval_days=excluded.interval_days,next_review_at=excluded.next_review_at,last_reviewed_at=CURRENT_TIMESTAMP`)
    .bind(userId, contentId, correct ? 1 : 0, correct ? 0 : 1, intervalDays, nextReviewAt).run();
  if (content.skillId) await updateSkillMasteryFromReview(userId, content.skillId, correct, nextCorrectAnswers, nextIncorrectAnswers);
  return { correct, explanation: quiz.explanation, intervalDays };
}

async function updateSkillMasteryFromReview(userId: string, skillId: number, correct: boolean, correctAnswers: number, incorrectAnswers: number) {
  const db = getDb();
  const current = await db.prepare("SELECT mastery FROM user_skill_progress WHERE user_id=? AND skill_id=?").bind(userId, skillId).first<{ mastery: number }>();
  const nextMastery = calculateSkillMastery({
    currentMastery: current?.mastery ?? 0,
    passed: correct,
    attempts: correctAnswers + incorrectAnswers,
    errors: incorrectAnswers,
    hintsUsed: 0,
    completedWithoutHints: true,
    completedFirstAttempt: false,
    reviewCorrectAnswers: correctAnswers,
    reviewIncorrectAnswers: incorrectAnswers,
  });
  await db.prepare(`INSERT INTO user_skill_progress (user_id,skill_id,mastery,successful_attempts,failed_attempts) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id,skill_id) DO UPDATE SET mastery=?,successful_attempts=successful_attempts+excluded.successful_attempts,
    failed_attempts=failed_attempts+excluded.failed_attempts`).bind(userId, skillId, nextMastery, correct ? 1 : 0, correct ? 0 : 1, nextMastery).run();
}

function parseList(value: string) {
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string" && item.length > 0) : []; }
  catch { return []; }
}

function parseQuiz(value: string): LibraryQuiz | null {
  const quiz = parseStoredQuiz(value);
  return quiz ? { question: quiz.question, options: quiz.options } : null;
}

function parseStoredQuiz(value: string) {
  try {
    const quiz = JSON.parse(value) as { question?: unknown; options?: unknown; correctIndex?: unknown; explanation?: unknown };
    if (typeof quiz.question !== "string" || !Array.isArray(quiz.options) || quiz.options.some((option) => typeof option !== "string") || !Number.isInteger(quiz.correctIndex)) return null;
    return { question: quiz.question, options: quiz.options as string[], correctIndex: quiz.correctIndex as number, explanation: typeof quiz.explanation === "string" ? quiz.explanation : "Revise o material antes de tentar novamente." };
  } catch { return null; }
}
