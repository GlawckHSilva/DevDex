import { getDb } from "./client";

export type ProjectFile = { path: "index.html" | "style.css" | "script.js"; language: "html" | "css" | "javascript"; starterCode: string };
export type ProjectStep = { id: number; slug: string; title: string; briefing: string; objective: string; activeFile: ProjectFile["path"]; requirementsJson: string; validatorJson: string; xpReward: number; sortOrder: number; state: "locked" | "available" | "in_progress" | "completed" };
export type ProjectView = { id: number; slug: string; title: string; description: string; xpReward: number; state: "available" | "in_progress" | "completed"; completedSteps: number; files: ProjectFile[]; steps: ProjectStep[] };
export type ProjectSummary = { slug: string; title: string; description: string; xpReward: number; state: ProjectView["state"]; completedSteps: number; totalSteps: number };

export async function getProjectSummaries(userId: string): Promise<ProjectSummary[]> {
  const result = await getDb().prepare(`SELECT p.slug,p.title,p.description,p.xp_reward AS xpReward,
    COALESCE(upp.state,'available') AS state,COALESCE(upp.completed_steps,0) AS completedSteps,
    (SELECT COUNT(*) FROM project_steps ps WHERE ps.project_id=p.id) AS totalSteps
    FROM projects p LEFT JOIN user_project_progress upp ON upp.project_id=p.id AND upp.user_id=?
    WHERE p.status='published' ORDER BY p.sort_order`).bind(userId).all<ProjectSummary>();
  return result.results;
}

export async function getProject(userId: string, slug: string): Promise<ProjectView | null> {
  const db = getDb();
  const project = await db.prepare(`SELECT p.id,p.slug,p.title,p.description,p.xp_reward AS xpReward,
    COALESCE(upp.state,'available') AS state,COALESCE(upp.completed_steps,0) AS completedSteps
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
