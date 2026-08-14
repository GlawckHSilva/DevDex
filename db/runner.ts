import { getDb } from "./client";

export type SubmissionMode = "run" | "test" | "attack";
export type SubmissionStatus = "passed" | "failed" | "error";
export const RUNNER_VERSION = "javascript-quickjs-1";

export async function getRecentSubmissionCount(userId: string, minutes = 5) {
  const row = await getDb().prepare(`SELECT COUNT(*) AS count FROM submissions
    WHERE user_id=? AND created_at >= datetime('now',?)`).bind(userId, `-${minutes} minutes`).first<{ count: number }>();
  return row?.count ?? 0;
}

export async function recordSubmission(input: {
  userId: string;
  missionId: number;
  mode: SubmissionMode;
  status: SubmissionStatus;
  codeHash: string;
  runtime: string;
  runnerVersion: string;
  durationMs: number;
  passedTests: number;
  failedTests: number;
  resultRows: number;
  errorType: string | null;
}) {
  await getDb().prepare(`INSERT INTO submissions
    (user_id,mission_id,mode,status,code_hash,runtime,runner_version,duration_ms,passed_tests,failed_tests,result_rows,error_type)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(
      input.userId, input.missionId, input.mode, input.status, input.codeHash, input.runtime, input.runnerVersion,
      input.durationMs, input.passedTests, input.failedTests, input.resultRows, input.errorType,
    ).run();
}
