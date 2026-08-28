import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import initSqlJs from "sql.js";
import test from "node:test";

const foundationUrl = new URL("../drizzle/0000_awesome_scalphunter.sql", import.meta.url);
const engineUrl = new URL("../drizzle/0002_nebulous_jean_grey.sql", import.meta.url);
const sqlEngineUrl = new URL("../drizzle/0003_clammy_screwball.sql", import.meta.url);
const routeUrl = new URL("../app/api/missions/[slug]/submit/route.ts", import.meta.url);
const betaUrl = new URL("../drizzle/0006_square_wallflower.sql", import.meta.url);
const metricsUrl = new URL("../db/metrics.ts", import.meta.url);
const rpgUrl = new URL("../drizzle/0007_cloudy_mandroid.sql", import.meta.url);
const campaignsUrl = new URL("../drizzle/0008_high_chat.sql", import.meta.url);
const studyUrl = new URL("../drizzle/0009_calm_dreaming_celestial.sql", import.meta.url);
const completeCurriculumUrl = new URL("../drizzle/0010_complete_curriculum.sql", import.meta.url);
const expandedCurriculumUrl = new URL("../drizzle/0011_eight_missions_per_zone.sql", import.meta.url);
const campaignLoreUrl = new URL("../drizzle/0012_campaign_lore.sql", import.meta.url);
const pythonCurriculumUrl = new URL("../drizzle/0013_python_curriculum.sql", import.meta.url);
const enemyAssetsUrl = new URL("../lib/enemy-assets.ts", import.meta.url);

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

test("public beta caps admissions and exposes only aggregate metrics", async () => {
  const [beta, metrics] = await Promise.all([readFile(betaUrl, "utf8"), readFile(metricsUrl, "utf8")]);
  assert.match(beta, /CREATE TABLE `beta_members`/);
  assert.match(metrics, /AVG\(duration_ms\)/);
  assert.doesNotMatch(metrics, /starter_code|source_hash|code_hash/);
});

test("RPG zone persists isolated characters, lives and battle events", async () => {
  const sql = await readFile(rpgUrl, "utf8");
  assert.match(sql, /CREATE TABLE `user_characters`/);
  assert.match(sql, /CREATE TABLE `user_battles`/);
  assert.match(sql, /CREATE TABLE `battle_events`/);
  assert.match(sql, /'Slime da Sintaxe'.*'Hidra dos Arrays'/s);
  assert.doesNotMatch(sql, /source_code|student_code/);
});

test("each technology is an independent configurable RPG campaign", async () => {
  const sql = await readFile(campaignsUrl, "utf8");
  assert.match(sql, /CREATE TABLE `campaigns`/);
  assert.match(sql, /CREATE TABLE `campaign_zones`/);
  assert.match(sql, /'Crônicas da Estrutura'.*'Reino dos Estilos'.*'Cidade da Lógica'.*'Minas dos Dados'/s);
  assert.match(sql, /'ruinas-da-estrutura'.*'distrito-sem-cor'.*'bosque-dos-fundamentos'.*'arquivo-perdido'/s);
  assert.match(sql, /'bosque-dos-fundamentos'.*'published',5,1/);
  assert.match(sql, /\(12,1.*\(16,2.*\(6,4/s);
  assert.doesNotMatch(sql, /source_code|student_code/);
});

test("D1 stores mission-specific battle study material", async () => {
  const sql = await readFile(studyUrl, "utf8");
  assert.match(sql, /CREATE TABLE `mission_study_materials`/);
  assert.match(sql, /'Títulos e parágrafos'.*'Navegação interna'/s);
  assert.match(sql, /href="#contato"/);
  assert.doesNotMatch(sql, /href="#servicos"/);
});

test("publishes 48 lesson-and-practice missions in six zones for every language", async () => {
  const [base, expanded, python] = await Promise.all([readFile(completeCurriculumUrl, "utf8"), readFile(expandedCurriculumUrl, "utf8"), readFile(pythonCurriculumUrl, "utf8")]);
  assert.equal([...base.matchAll(/'Aula e prática:/g)].length, 101);
  assert.equal([...expanded.matchAll(/'Aula e prática:/g)].length, 72);
  assert.equal([...expanded.matchAll(/'Antes da batalha, entenda/g)].length, 72);
  assert.match(expanded, /48 aulas explicativas e 48 práticas/);
  assert.match(expanded, /'Central de Inteligência'.*'sql-dashboard-final'/s);
  assert.equal([...expanded.matchAll(/UPDATE campaign_zones SET boss_mission_id=/g)].length, 24);
  assert.equal([...python.matchAll(/'python','python-pyodide-1'/g)].length, 48);
  assert.equal([...python.matchAll(/'Antes da batalha, entenda/g)].length, 48);
  assert.match(python, /'Terminal dos Fundamentos'.*'Núcleo Profissional'/s);
  assert.doesNotMatch(expanded, /student_code|source_code/);
  assert.doesNotMatch(python, /student_code|source_code/);
});

test("each zone has eight sequential missions and the eighth is its boss", async () => {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  const directory = new URL("../drizzle/", import.meta.url);
  for (const file of (await readdir(directory)).filter((name) => /^\d{4}.*\.sql$/.test(name)).sort()) {
    const migration = await readFile(new URL(file, directory), "utf8");
    for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) db.run(statement);
  }
  const result = db.exec(`SELECT campaign_id,COUNT(*) AS zones,SUM(missions) AS missions FROM (
    SELECT cz.campaign_id,cz.id,COUNT(mbc.mission_id) AS missions,
      SUM(CASE WHEN mbc.enemy_type='boss' AND mbc.sort_order=8 THEN 1 ELSE 0 END) AS bosses
    FROM campaign_zones cz JOIN mission_battle_configs mbc ON mbc.zone_id=cz.id
    GROUP BY cz.id HAVING missions=8 AND bosses=1
  ) GROUP BY campaign_id ORDER BY campaign_id`)[0];
  db.close();
  assert.deepEqual(result.values, [[1,6,48],[2,6,48],[3,6,48],[4,6,48],[5,6,48]]);
});

test("campaign lore is campaign-specific and its view state is persistent", async () => {
  const sql = await readFile(campaignLoreUrl, "utf8");
  assert.match(sql, /lore_title.*lore_subtitle.*lore_sender.*lore_intro_text.*lore_short_description.*lore_signature.*lore_transmission_id/s);
  assert.match(sql, /Crônicas da Estrutura.*Reino dos Estilos.*Cidade da Lógica.*Minas dos Dados/s);
  assert.match(sql, /user_learning_paths.*lore_seen_at/s);
  assert.doesNotMatch(sql, /total_xp|awarded_xp|user_missions/);
});

test("the first HTML zone maps every encounter to a dedicated sprite", async () => {
  const [source, files] = await Promise.all([
    readFile(enemyAssetsUrl, "utf8"),
    readdir(new URL("../public/battles/enemies/", import.meta.url)),
  ]);
  for (const name of ["Espectro do Esqueleto", "Bug de Atalho para serviços", "Bug de Catálogo organizado", "Bug de Contato do cliente", "Bug de Metadados essenciais", "Bug de Parágrafos organizados", "Elite de Link externo seguro", "Guardião de Página de apresentação"]) assert.match(source, new RegExp(name));
  assert.equal(files.filter((file) => /(?:bug|elite|guardiao|espectro).+\.png$/.test(file)).length >= 8, true);
});
