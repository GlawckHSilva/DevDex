import { getDb } from "./client";

export type ProjectFile = { path: "index.html" | "style.css" | "script.js"; language: "html" | "css" | "javascript"; starterCode: string };
export type ProjectStep = { id: number; slug: string; title: string; briefing: string; objective: string; activeFile: ProjectFile["path"]; requirementsJson: string; validatorJson: string; xpReward: number; sortOrder: number; state: "locked" | "available" | "in_progress" | "completed" };
export type ProjectView = { id: number; slug: string; title: string; description: string; introduction: string; deadlineDays: number; minLevel: number; requiredMaterials: number; requiredBattles: number; xpReward: number; state: "locked" | "available" | "in_progress" | "completed"; completedSteps: number; files: ProjectFile[]; steps: ProjectStep[] };
export type ProjectSummary = { slug: string; title: string; description: string; deadlineDays: number; minLevel: number; requiredMaterials: number; requiredBattles: number; xpReward: number; state: ProjectView["state"]; completedSteps: number; totalSteps: number; newlyUnlocked: number };
export type ProjectRepository = { repositoryUrl: string; branch: string; latestCommitSha: string | null; reviewStatus: "linked" | "passed" | "needs_changes" | "error"; passedTests: number; failedTests: number; reviewedAt: string | null; aiStatus: "unavailable" | "completed" | "error"; aiSummary: string | null; aiStrengths: string[]; aiImprovements: string[]; aiNextStep: string | null };

export async function getProjectSummaries(userId: string): Promise<ProjectSummary[]> {
  const db = getDb();
  const result = await db.prepare(`SELECT p.slug,p.title,p.description,p.deadline_days AS deadlineDays,p.min_level AS minLevel,
    p.required_materials AS requiredMaterials,p.required_battles AS requiredBattles,p.xp_reward AS xpReward,
    COALESCE(upp.state,'locked') AS state,COALESCE(upp.completed_steps,0) AS completedSteps,
    (SELECT COUNT(*) FROM project_steps ps WHERE ps.project_id=p.id) AS totalSteps,
    EXISTS(SELECT 1 FROM user_project_notifications upn WHERE upn.user_id=? AND upn.project_id=p.id AND upn.seen_at IS NULL) AS newlyUnlocked
    FROM projects p LEFT JOIN user_project_progress upp ON upp.project_id=p.id AND upp.user_id=?
    WHERE p.status='published' ORDER BY p.sort_order`).bind(userId, userId).all<ProjectSummary>();
  await db.prepare("UPDATE user_project_notifications SET seen_at=CURRENT_TIMESTAMP WHERE user_id=? AND seen_at IS NULL").bind(userId).run();
  return result.results;
}

export async function getProject(userId: string, slug: string): Promise<ProjectView | null> {
  const db = getDb();
  const project = await db.prepare(`SELECT p.id,p.slug,p.title,p.description,p.introduction,p.deadline_days AS deadlineDays,
    p.min_level AS minLevel,p.required_materials AS requiredMaterials,p.required_battles AS requiredBattles,p.xp_reward AS xpReward,
    COALESCE(upp.state,'locked') AS state,COALESCE(upp.completed_steps,0) AS completedSteps
    FROM projects p LEFT JOIN user_project_progress upp ON upp.project_id=p.id AND upp.user_id=?
    WHERE p.slug=? AND p.status='published'`).bind(userId, slug).first<Omit<ProjectView, "files" | "steps">>();
  if (!project) return null;
  const [files, steps] = await Promise.all([
    db.prepare(`SELECT path,language,starter_code AS starterCode FROM project_files WHERE project_id=? ORDER BY sort_order`).bind(project.id).all<ProjectFile>(),
    db.prepare(`SELECT ps.id,ps.slug,ps.title,ps.briefing,ps.objective,ps.active_file AS activeFile,
      ps.requirements_json AS requirementsJson,ps.validator_json AS validatorJson,ps.xp_reward AS xpReward,ps.sort_order AS sortOrder,
      CASE WHEN ups.state='completed' THEN 'completed'
        WHEN ps.sort_order=1 OR EXISTS (SELECT 1 FROM project_steps prev JOIN user_project_steps done ON done.step_id=prev.id AND done.user_id=? AND done.state='completed' WHERE prev.project_id=ps.project_id AND prev.sort_order=ps.sort_order-1) THEN COALESCE(ups.state,'available')
        ELSE 'locked' END AS state
      FROM project_steps ps LEFT JOIN user_project_steps ups ON ups.step_id=ps.id AND ups.user_id=?
      WHERE ps.project_id=? ORDER BY ps.sort_order`).bind(userId, userId, project.id).all<ProjectStep>(),
  ]);
  return {
    ...project,
    files: files.results.map((file) => ({ ...file, starterCode: file.starterCode.replaceAll("\\n", "\n") })),
    steps: steps.results,
  };
}

export async function refreshProjectUnlocks(userId: string) {
  const db = getDb();
  const eligible = `
    (SELECT level FROM profiles WHERE user_id=upp.user_id)>=p.min_level
    AND (SELECT COUNT(*) FROM user_lessons WHERE user_id=upp.user_id AND state='completed')>=p.required_materials
    AND (SELECT COUNT(*) FROM user_missions WHERE user_id=upp.user_id AND state='completed')>=p.required_battles`;
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO user_project_notifications (user_id,project_id)
      SELECT upp.user_id,p.id FROM user_project_progress upp JOIN projects p ON p.id=upp.project_id
      WHERE upp.user_id=? AND upp.state='locked' AND ${eligible}`).bind(userId),
    db.prepare(`UPDATE user_project_progress AS upp SET state=CASE
      WHEN state='completed' THEN 'completed'
      WHEN EXISTS (SELECT 1 FROM projects p WHERE p.id=upp.project_id AND ${eligible}) THEN 'available'
      ELSE 'locked' END WHERE upp.user_id=?`).bind(userId),
  ]);
}

export async function recordProjectAttempt(userId: string, project: ProjectView, step: ProjectStep, passed: boolean) {
  const db = getDb();
  if (!passed) {
    await db.batch([
      db.prepare(`INSERT INTO user_project_steps (user_id,step_id,state,attempts) VALUES (?,?,'in_progress',1)
        ON CONFLICT(user_id,step_id) DO UPDATE SET attempts=attempts+1`).bind(userId, step.id),
      db.prepare(`UPDATE user_project_progress SET state=CASE WHEN state='completed' THEN state ELSE 'in_progress' END,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND project_id=?`).bind(userId, project.id),
    ]);
    return projectProgress(db, userId, project.id, 0);
  }

  const results = await db.batch([
    db.prepare(`INSERT OR IGNORE INTO user_project_steps (user_id,step_id,state) VALUES (?,?,'in_progress')`).bind(userId, step.id),
    db.prepare(`UPDATE profiles SET total_xp=total_xp+?,level=CAST((total_xp+?)/500 AS INTEGER)+1,updated_at=CURRENT_TIMESTAMP
      WHERE user_id=? AND EXISTS (SELECT 1 FROM user_project_steps WHERE user_id=? AND step_id=? AND awarded_xp=0)`).bind(step.xpReward, step.xpReward, userId, userId, step.id),
    db.prepare(`INSERT OR IGNORE INTO project_xp_history (user_id,project_id,step_id,amount) SELECT ?,?,?,?
      WHERE EXISTS (SELECT 1 FROM user_project_steps WHERE user_id=? AND step_id=? AND awarded_xp=0)`).bind(userId, project.id, step.id, step.xpReward, userId, step.id),
    db.prepare(`UPDATE user_project_steps SET state='completed',attempts=attempts+1,awarded_xp=?,completed_at=COALESCE(completed_at,CURRENT_TIMESTAMP) WHERE user_id=? AND step_id=?`).bind(step.xpReward, userId, step.id),
    db.prepare(`UPDATE user_project_progress SET state=CASE WHEN (SELECT COUNT(*) FROM user_project_steps ups JOIN project_steps ps ON ps.id=ups.step_id WHERE ups.user_id=? AND ps.project_id=? AND ups.state='completed')=(SELECT COUNT(*) FROM project_steps WHERE project_id=?) THEN 'completed' ELSE 'in_progress' END,
      completed_steps=(SELECT COUNT(*) FROM user_project_steps ups JOIN project_steps ps ON ps.id=ups.step_id WHERE ups.user_id=? AND ps.project_id=? AND ups.state='completed'),
      awarded_xp=(SELECT COALESCE(SUM(ups.awarded_xp),0) FROM user_project_steps ups JOIN project_steps ps ON ps.id=ups.step_id WHERE ups.user_id=? AND ps.project_id=?),
      current_step_id=(SELECT id FROM project_steps WHERE project_id=? AND sort_order>? ORDER BY sort_order LIMIT 1),
      completed_at=CASE WHEN ?=(SELECT MAX(sort_order) FROM project_steps WHERE project_id=?) THEN COALESCE(completed_at,CURRENT_TIMESTAMP) ELSE completed_at END,updated_at=CURRENT_TIMESTAMP
      WHERE user_id=? AND project_id=?`).bind(userId, project.id, project.id, userId, project.id, userId, project.id, project.id, step.sortOrder, step.sortOrder, project.id, userId, project.id),
  ]);
  return projectProgress(db, userId, project.id, results[1]?.meta?.changes === 1 ? step.xpReward : 0);
}

async function projectProgress(db: ReturnType<typeof getDb>, userId: string, projectId: number, gainedXp: number) {
  const row = await db.prepare(`SELECT p.total_xp AS totalXp,upp.state AS projectState,upp.completed_steps AS completedSteps,
    ps.slug AS nextStepSlug FROM profiles p JOIN user_project_progress upp ON upp.user_id=p.user_id
    LEFT JOIN project_steps ps ON ps.id=upp.current_step_id WHERE p.user_id=? AND upp.project_id=?`).bind(userId, projectId).first<{ totalXp: number; projectState: ProjectView["state"]; completedSteps: number; nextStepSlug: string | null }>();
  return { gainedXp, totalXp: row?.totalXp ?? 0, projectState: row?.projectState ?? "in_progress", completedSteps: row?.completedSteps ?? 0, nextStepSlug: row?.nextStepSlug ?? null };
}

export async function getRecentProjectSubmissionCount(userId: string, minutes = 5) {
  const row = await getDb().prepare(`SELECT COUNT(*) AS count FROM project_submissions WHERE user_id=? AND created_at>=datetime('now',?)`).bind(userId, `-${minutes} minutes`).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function recordProjectSubmission(input: { userId: string; projectId: number; stepId: number; status: "passed" | "failed" | "error"; sourceHash: string; durationMs: number; passedTests: number; failedTests: number; errorType: string | null }) {
  await getDb().prepare(`INSERT INTO project_submissions (user_id,project_id,step_id,status,source_hash,duration_ms,passed_tests,failed_tests,error_type) VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(input.userId, input.projectId, input.stepId, input.status, input.sourceHash, input.durationMs, input.passedTests, input.failedTests, input.errorType).run();
}

export async function getProjectRepository(userId: string, projectId: number) {
  const row = await getDb().prepare(`SELECT repository_url AS repositoryUrl,branch,latest_commit_sha AS latestCommitSha,
    review_status AS reviewStatus,passed_tests AS passedTests,failed_tests AS failedTests,reviewed_at AS reviewedAt,
    ai_status AS aiStatus,ai_summary AS aiSummary,ai_strengths_json AS aiStrengthsJson,ai_improvements_json AS aiImprovementsJson,ai_next_step AS aiNextStep
    FROM user_project_repositories WHERE user_id=? AND project_id=?`).bind(userId, projectId).first<Omit<ProjectRepository, "aiStrengths" | "aiImprovements"> & { aiStrengthsJson: string; aiImprovementsJson: string }>();
  return row ? { ...row, aiStrengths: JSON.parse(row.aiStrengthsJson) as string[], aiImprovements: JSON.parse(row.aiImprovementsJson) as string[] } : null;
}

export async function saveProjectRepository(input: { userId: string; projectId: number; repositoryUrl: string; owner: string; repo: string; branch: string; latestCommitSha: string | null; reviewStatus: ProjectRepository["reviewStatus"]; passedTests: number; failedTests: number; aiStatus?: ProjectRepository["aiStatus"]; aiSummary?: string | null; aiStrengths?: string[]; aiImprovements?: string[]; aiNextStep?: string | null }) {
  await getDb().prepare(`INSERT INTO user_project_repositories
    (user_id,project_id,repository_url,owner,repo,branch,latest_commit_sha,review_status,passed_tests,failed_tests,reviewed_at,ai_status,ai_summary,ai_strengths_json,ai_improvements_json,ai_next_step)
    VALUES (?,?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP,?,?,?,?,?)
    ON CONFLICT(user_id,project_id) DO UPDATE SET repository_url=excluded.repository_url,owner=excluded.owner,repo=excluded.repo,
    branch=excluded.branch,latest_commit_sha=excluded.latest_commit_sha,review_status=excluded.review_status,
    passed_tests=excluded.passed_tests,failed_tests=excluded.failed_tests,reviewed_at=CURRENT_TIMESTAMP,ai_status=excluded.ai_status,
    ai_summary=excluded.ai_summary,ai_strengths_json=excluded.ai_strengths_json,ai_improvements_json=excluded.ai_improvements_json,ai_next_step=excluded.ai_next_step,updated_at=CURRENT_TIMESTAMP`)
    .bind(input.userId, input.projectId, input.repositoryUrl, input.owner, input.repo, input.branch, input.latestCommitSha, input.reviewStatus, input.passedTests, input.failedTests,
      input.aiStatus ?? "unavailable", input.aiSummary ?? null, JSON.stringify(input.aiStrengths ?? []), JSON.stringify(input.aiImprovements ?? []), input.aiNextStep ?? null).run();
}
