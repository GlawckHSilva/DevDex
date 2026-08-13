import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL("../supabase/migrations/20260813130000_foundation.sql", import.meta.url);

test("migration protects private mission tests", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on public\.mission_tests from anon, authenticated/i);
  assert.doesNotMatch(sql, /policy[^;]+mission_tests/i);
});

test("migration constrains mastery and user ownership", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /mastery between 0 and 100/i);
  assert.match(sql, /auth\.uid\(\)\) = user_id/i);
  assert.match(sql, /revoke insert, update, delete on public\.user_skill_progress/i);
});
