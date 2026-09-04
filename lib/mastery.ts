export type MasteryState = "Novo" | "Familiar" | "Competente" | "Proficiente" | "Dominado";

export type MasteryEvidence = {
  currentMastery: number;
  passed: boolean;
  attempts: number;
  errors: number;
  hintsUsed: number;
  completedWithoutHints: boolean;
  completedFirstAttempt: boolean;
  enemyType?: "enemy" | "elite" | "boss" | null;
  reviewCorrectAnswers?: number;
  reviewIncorrectAnswers?: number;
};

const stateBands: Array<{ max: number; label: MasteryState }> = [
  { max: 24, label: "Novo" },
  { max: 49, label: "Familiar" },
  { max: 74, label: "Competente" },
  { max: 89, label: "Proficiente" },
  { max: 100, label: "Dominado" },
];

export function clampMastery(value: number) {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
}

export function masteryState(value: number): MasteryState {
  const mastery = clampMastery(value);
  return stateBands.find((band) => mastery <= band.max)?.label ?? "Novo";
}

export function calculateSkillMastery(evidence: MasteryEvidence) {
  const current = clampMastery(evidence.currentMastery);
  const attempts = Math.max(0, Math.trunc(evidence.attempts));
  const errors = Math.max(0, Math.trunc(evidence.errors));
  const hints = Math.max(0, Math.trunc(evidence.hintsUsed));
  const reviewBonus = Math.min(8, Math.max(0, evidence.reviewCorrectAnswers ?? 0) * 2);
  const reviewPenalty = Math.min(8, Math.max(0, evidence.reviewIncorrectAnswers ?? 0) * 2);
  const enemyBonus = evidence.enemyType === "boss" ? 14 : evidence.enemyType === "elite" ? 8 : 0;

  if (!evidence.passed) {
    const loss = (current >= 75 ? 3 : current >= 50 ? 2 : 1) + Math.min(3, Math.floor(errors / 3));
    return clampMastery(current - loss);
  }

  const evidenceCeiling = clampMastery(
    55 +
      enemyBonus +
      (evidence.completedWithoutHints ? 8 : 0) +
      (evidence.completedFirstAttempt ? 7 : 0) +
      reviewBonus -
      reviewPenalty -
      Math.min(14, Math.max(0, attempts - 1) * 2) -
      Math.min(12, hints * 3),
  );

  if (evidenceCeiling <= current) {
    return current;
  }

  const firstPassFloor = current === 0 ? Math.min(50, evidenceCeiling) : current;
  const growth = Math.max(1, Math.ceil((evidenceCeiling - current) * 0.35));

  return clampMastery(Math.min(evidenceCeiling, Math.max(firstPassFloor, current + growth)));
}
