import { getDb } from "./client";

type Summary = { totalUsers: number; activeUsers7d: number; missionStarts: number; missionCompletions: number; submissions: number; runnerErrors: number; averageDurationMs: number };
type MissionMetric = { id: number; title: string; runtime: string; attempts: number; defeats: number; errors: number; completions: number; averageDurationMs: number };
type RuntimeMetric = { runtime: string; attempts: number; errors: number; averageDurationMs: number };
type BattleMetric = { missionId: number; enemyName: string; enemyType: string; battles: number; victories: number; defeats: number; researches: number; averageLivesLost: number; averageDurationSeconds: number };

export async function getPublicStatus() {
  const db = getDb();
  const [curriculum, projects] = await Promise.all([
    db.prepare(`SELECT COUNT(DISTINCT lp.id) AS paths,COUNT(DISTINCT m.id) AS missions,COUNT(DISTINCT m.runtime) AS runtimes
      FROM learning_paths lp JOIN skills s ON s.learning_path_id=lp.id JOIN missions m ON m.skill_id=s.id
      WHERE lp.status='published' AND m.status='published'`).first<{ paths: number; missions: number; runtimes: number }>(),
    db.prepare(`SELECT COUNT(DISTINCT p.id) AS projects,COUNT(ps.id) AS steps FROM projects p
      LEFT JOIN project_steps ps ON ps.project_id=p.id WHERE p.status='published'`).first<{ projects: number; steps: number }>(),
  ]);
  return { paths: curriculum?.paths ?? 0, missions: curriculum?.missions ?? 0, runtimes: curriculum?.runtimes ?? 0, projects: projects?.projects ?? 0, projectSteps: projects?.steps ?? 0 };
}

export async function getAdminMetrics() {
  const db = getDb();
  const [summary, missions, runtimes, projects, battles] = await Promise.all([
    db.prepare(`SELECT
      (SELECT COUNT(*) FROM profiles) AS totalUsers,
      (SELECT COUNT(*) FROM profiles WHERE updated_at>=datetime('now','-7 days')) AS activeUsers7d,
      (SELECT COUNT(*) FROM user_missions WHERE attempts>0) AS missionStarts,
      (SELECT COUNT(*) FROM user_missions WHERE state='completed') AS missionCompletions,
      (SELECT COUNT(*) FROM submissions) AS submissions,
      (SELECT COUNT(*) FROM submissions WHERE status='error') AS runnerErrors,
      (SELECT COALESCE(ROUND(AVG(duration_ms)),0) FROM submissions) AS averageDurationMs`).first<Summary>(),
    db.prepare(`SELECT m.id,m.title,m.runtime,COUNT(su.id) AS attempts,
      COALESCE(SUM(CASE WHEN su.status IN ('failed','error') THEN 1 ELSE 0 END),0) AS defeats,
      COALESCE(SUM(CASE WHEN su.status='error' THEN 1 ELSE 0 END),0) AS errors,
      (SELECT COUNT(*) FROM user_missions um WHERE um.mission_id=m.id AND um.state='completed') AS completions,
      COALESCE(ROUND(AVG(su.duration_ms)),0) AS averageDurationMs
      FROM missions m LEFT JOIN submissions su ON su.mission_id=m.id
      WHERE m.status='published' GROUP BY m.id ORDER BY attempts DESC,m.sort_order`).all<MissionMetric>(),
    db.prepare(`SELECT runtime,COUNT(*) AS attempts,
      SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) AS errors,
      COALESCE(ROUND(AVG(duration_ms)),0) AS averageDurationMs
      FROM submissions GROUP BY runtime ORDER BY attempts DESC`).all<RuntimeMetric>(),
    db.prepare(`SELECT COUNT(*) AS attempts,
      COALESCE(SUM(CASE WHEN status='error' THEN 1 ELSE 0 END),0) AS errors,
      COALESCE(SUM(CASE WHEN status='passed' THEN 1 ELSE 0 END),0) AS passed,
      COALESCE(ROUND(AVG(duration_ms)),0) AS averageDurationMs FROM project_submissions`).first<{ attempts: number; errors: number; passed: number; averageDurationMs: number }>(),
    db.prepare(`SELECT mbc.mission_id AS missionId,mbc.enemy_name AS enemyName,mbc.enemy_type AS enemyType,COUNT(ub.user_id) AS battles,
      COALESCE(SUM(CASE WHEN ub.state='completed' THEN 1 ELSE 0 END),0) AS victories,
      COALESCE(SUM(ub.defeats),0) AS defeats,COALESCE(SUM(ub.researches),0) AS researches,
      COALESCE(ROUND(AVG(CASE WHEN ub.state='completed' THEN 3-ub.lives END),1),0) AS averageLivesLost,
      COALESCE(ROUND(AVG(CASE WHEN ub.completed_at IS NOT NULL THEN (julianday(ub.completed_at)-julianday(ub.started_at))*86400 END)),0) AS averageDurationSeconds
      FROM mission_battle_configs mbc LEFT JOIN user_battles ub ON ub.mission_id=mbc.mission_id
      GROUP BY mbc.mission_id ORDER BY mbc.sort_order`).all<BattleMetric>(),
  ]);
  return {
    summary: summary ?? { totalUsers: 0, activeUsers7d: 0, missionStarts: 0, missionCompletions: 0, submissions: 0, runnerErrors: 0, averageDurationMs: 0 },
    missions: missions.results,
    runtimes: runtimes.results,
    projects: projects ?? { attempts: 0, errors: 0, passed: 0, averageDurationMs: 0 },
    battles: battles.results,
  };
}
