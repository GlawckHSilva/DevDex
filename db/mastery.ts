import { masteryState, type MasteryState } from "@/lib/mastery";
import { getDb } from "./client";

type MasteryRow = {
  id: number;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  technologyName: string;
  technologySlug: string;
  pathName: string;
  pathSlug: string;
  zoneName: string | null;
  mastery: number;
  successfulAttempts: number;
  failedAttempts: number;
  relatedActivities: number;
  lastPracticeAt: string | null;
};

export type MasteryConcept = MasteryRow & {
  state: MasteryState;
};

export type MasteryTechnology = {
  name: string;
  slug: string;
  mastery: number;
  concepts: MasteryConcept[];
};

export type MasteryOverview = {
  overallMastery: number;
  totalConcepts: number;
  practicedConcepts: number;
  technologies: MasteryTechnology[];
  strengths: MasteryConcept[];
};

function average(values: number[]) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}

export async function getMasteryOverview(userId: string): Promise<MasteryOverview> {
  const rows = await getDb().prepare(`SELECT s.id,s.slug,s.name,s.description,s.sort_order AS sortOrder,
    t.name AS technologyName,t.slug AS technologySlug,lp.name AS pathName,lp.slug AS pathSlug,
    (SELECT cz.title FROM lessons l LEFT JOIN campaign_zones cz ON cz.id=l.zone_id
      WHERE l.skill_id=s.id AND l.status='published' ORDER BY l.sort_order LIMIT 1) AS zoneName,
    COALESCE(usp.mastery,0) AS mastery,COALESCE(usp.successful_attempts,0) AS successfulAttempts,
    COALESCE(usp.failed_attempts,0) AS failedAttempts,
    (SELECT COUNT(*) FROM missions m WHERE m.skill_id=s.id AND m.status='published') AS relatedActivities,
    (SELECT MAX(mah.created_at) FROM mission_attempt_history mah JOIN missions m ON m.id=mah.mission_id
      WHERE mah.user_id=? AND m.skill_id=s.id) AS lastPracticeAt
    FROM skills s JOIN learning_paths lp ON lp.id=s.learning_path_id
    JOIN technologies t ON t.id=lp.technology_id
    LEFT JOIN user_skill_progress usp ON usp.skill_id=s.id AND usp.user_id=?
    WHERE s.status='published' AND lp.status='published'
    ORDER BY t.name,lp.id,s.sort_order`).bind(userId, userId).all<MasteryRow>();

  const concepts = rows.results.map((row) => ({ ...row, state: masteryState(row.mastery) }));
  const byTechnology = new Map<string, MasteryTechnology>();
  for (const concept of concepts) {
    const current = byTechnology.get(concept.technologySlug) ?? { name: concept.technologyName, slug: concept.technologySlug, mastery: 0, concepts: [] };
    current.concepts.push(concept);
    byTechnology.set(concept.technologySlug, current);
  }

  const technologies = Array.from(byTechnology.values()).map((technology) => ({
    ...technology,
    mastery: average(technology.concepts.map((concept) => concept.mastery)),
  }));

  return {
    overallMastery: average(concepts.map((concept) => concept.mastery)),
    totalConcepts: concepts.length,
    practicedConcepts: concepts.filter((concept) => concept.successfulAttempts + concept.failedAttempts > 0).length,
    technologies,
    strengths: [...concepts].filter((concept) => concept.mastery >= 75).sort((a, b) => b.mastery - a.mastery).slice(0, 6),
  };
}
