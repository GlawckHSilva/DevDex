import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const foundationUrl = new URL("../drizzle/0000_awesome_scalphunter.sql", import.meta.url);
const engineUrl = new URL("../drizzle/0002_nebulous_jean_grey.sql", import.meta.url);
const sqlEngineUrl = new URL("../drizzle/0003_clammy_screwball.sql", import.meta.url);
const routeUrl = new URL("../app/api/missions/[slug]/submit/route.ts", import.meta.url);

test("D1 models five private, sequential missions", async () => {
  const sql = await readFile(engineUrl, "utf8");
  assert.match(sql, /CREATE TABLE `mission_prerequisites`/);
  assert.match(sql, /'filtrar-pares'/);
  assert.match(sql, /\(5,4\)/);
  assert.match(sql, /`is_private`/);
});

test("D1 configures SQLite missions without storing student queries", async () => {
  const sql = await readFile(sqlEngineUrl, "utf8");
  assert.match(sql, /CREATE TABLE `sql_mission_configs`/);
  assert.match(sql, /SQL Fundamentals · SQLite/);
  assert.match(sql, /'select'.*'where'.*'order-by'.*'between'.*'like'.*'in'/is);
  assert.doesNotMatch(sql, /student_query|source_code/);
});

test("D1 prevents duplicate XP and the API hides private test data", async () => {
  const [foundation, route] = await Promise.all([readFile(foundationUrl, "utf8"), readFile(routeUrl, "utf8")]);
  assert.match(foundation, /UNIQUE INDEX `idx_xp_user_mission`/);
  assert.match(route, /name: `Teste \$\{index \+ 1\}`/);
  assert.match(route, /results: results\.map/);
});
