import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import initSqlJs from "sql.js";
import outline from "./core-courses-outline.json" with { type: "json" };

const esc = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => esc(JSON.stringify(value));
const SQL = await initSqlJs({ locateFile: (file) => join(process.cwd(), "node_modules", "sql.js", "dist", file) });
const database = new SQL.Database();
for (const file of (await readdir("drizzle")).filter((name) => /^\d{4}.*\.sql$/.test(name) && name < "0016").sort()) {
  const migration = await readFile(join("drizzle", file), "utf8");
  for (const statement of migration.split("--> statement-breakpoint").map((value) => value.trim()).filter(Boolean)) database.run(statement);
}

const first = (query) => database.exec(query)[0]?.values[0] ?? null;
const mission = (id) => {
  const row = first(`SELECT slug,title FROM missions WHERE id=${id}`);
  if (!row) throw new Error(`Mission ${id} not found`);
  return { id, slug: String(row[0]), title: String(row[1]) };
};
const validators = (ids) => {
  const rules = ids.flatMap((id) => {
    const value = first(`SELECT validator_json FROM web_mission_configs WHERE mission_id=${id}`)?.[0];
    return value ? JSON.parse(String(value)) : [];
  });
  return [...new Map(rules.map((rule) => [JSON.stringify(rule), rule])).values()];
};

const statements = [];
let lessonId = 6001;
let skillId = 7001;
let missionId = 7001;
let createdMissions = 0;

function cloneMission({ course, zone, sourceId, skill, slugSuffix, title, objective, localOrder, globalOrder, type, mergedValidators }) {
  const source = mission(sourceId);
  const id = missionId++;
  const slug = `${course.key}2-${source.slug}-${slugSuffix}`;
  const difficulty = zone.index === 0 ? "beginner" : zone.index === 1 ? "easy" : zone.index < 4 ? "medium" : "hard";
  const xp = type === "boss" ? 320 : type === "elite" ? 190 : 120 + zone.index * 15;
  statements.push(`INSERT INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug)
    SELECT ${id},${skill},${esc(slug)},${esc(title)},'Prática deliberada após o material de estudo.',${esc(objective)},starter_code,function_name,parameters_json,runtime,runner_version,'${difficulty}',2,'published',${xp},${globalOrder},NULL FROM missions WHERE id=${sourceId};`);
  statements.push(`INSERT INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order)
    SELECT ${id},name,input_json,expected_json,is_private,sort_order FROM mission_tests WHERE mission_id=${sourceId};`);
  statements.push(`INSERT INTO web_mission_configs (mission_id,document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length)
    SELECT ${id},document_type,runtime_version,starter_code,preview_html,preview_css,validator_json,max_length FROM web_mission_configs WHERE mission_id=${sourceId};`);
  statements.push(`INSERT INTO sql_mission_configs (mission_id,dialect,runtime_version,schema_sql,seed_sql,starter_sql,expected_result_json,table_schema_json,table_preview_json,max_rows,timeout_ms,max_statements)
    SELECT ${id},dialect,runtime_version,schema_sql,seed_sql,starter_sql,expected_result_json,table_schema_json,table_preview_json,max_rows,timeout_ms,max_statements FROM sql_mission_configs WHERE mission_id=${sourceId};`);
  if (mergedValidators?.length) statements.push(`UPDATE web_mission_configs SET validator_json=${json(mergedValidators)} WHERE mission_id=${id};`);
  const label = type === "boss" ? "Guardião" : type === "elite" ? "Elite" : "Bug";
  statements.push(`INSERT INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order)
    SELECT ${id},${zone.id},slug,${esc(`${label} de ${title}`)},'${type}',${globalOrder},${esc("Revise o material, resolva uma exigência por vez e teste antes de atacar.")},${esc(`A corrupção exige domínio de ${objective.toLowerCase()}`)},'Aplique o conteúdo estudado e satisfaça todos os testes do backend.',${type === "boss" ? esc("O chefe reúne todos os conteúdos da zona em uma entrega completa.") : "''"},${type === "boss" ? esc("Zona restaurada. O próximo estudo foi liberado.") : "''"},${localOrder} FROM campaign_zones WHERE id=${zone.id};`);
  createdMissions += 1;
  return { id, slug, title };
}

for (const course of outline.courses) {
  const existingIds = course.zones.flatMap((zone) => zone.existing);
  statements.push(`DELETE FROM mission_prerequisites WHERE mission_id IN (${existingIds.join(",")});`);
  statements.push(`DELETE FROM mission_study_materials WHERE mission_id IN (SELECT m.id FROM missions m JOIN skills s ON s.id=m.skill_id WHERE s.learning_path_id=${course.pathId});`);
  statements.push(`UPDATE lessons SET status='deprecated' WHERE zone_id IS NULL AND skill_id IN (SELECT id FROM skills WHERE learning_path_id=${course.pathId});`);
  statements.push(`UPDATE learning_paths SET version=4,description='24 materiais de estudo e 126 batalhas em 150 etapas, do básico ao profissional.' WHERE id=${course.pathId};`);
  let previousZoneBoss = null;
  for (let zoneIndex = 0; zoneIndex < course.zones.length; zoneIndex += 1) {
    const zone = { ...course.zones[zoneIndex], index: zoneIndex };
    let previousBlockLast = previousZoneBoss;
    for (let blockIndex = 0; blockIndex < zone.modules.length; blockIndex += 1) {
      const [moduleSlug, moduleTitle, concepts, exampleCode, resourceUrl] = zone.modules[blockIndex];
      const pair = zone.existing.slice(blockIndex * 2, blockIndex * 2 + 2).map(mission);
      const currentSkill = skillId++;
      const currentLesson = lessonId++;
      const lessonOrder = blockIndex * 6 + 1;
      const globalLessonOrder = zoneIndex * 25 + lessonOrder;
      statements.push(`INSERT INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES (${currentSkill},${course.pathId},${esc(`${course.key}2-${moduleSlug}`)},${esc(moduleTitle)},${esc(concepts)},0,${globalLessonOrder},'published');`);

      const block = [pair[0], pair[1]];
      const generated = [
        cloneMission({ course, zone, sourceId: pair[0].id, skill: currentSkill, slugSuffix: "treino", title: `Treino: ${pair[0].title}`, objective: `Resolva novamente ${pair[0].title.toLowerCase()} sem consultar a solução e explique cada decisão.`, localOrder: lessonOrder + 3, globalOrder: globalLessonOrder + 3, type: "enemy" }),
        cloneMission({ course, zone, sourceId: pair[1].id, skill: currentSkill, slugSuffix: "aplicacao", title: `Aplicação: ${pair[1].title}`, objective: `Aplique ${pair[1].title.toLowerCase()} em uma segunda rodada com todos os casos de teste.`, localOrder: lessonOrder + 4, globalOrder: globalLessonOrder + 4, type: "enemy" }),
        cloneMission({ course, zone, sourceId: pair[1].id, skill: currentSkill, slugSuffix: "elite", title: `Elite: ${moduleTitle}`, objective: `Integre ${concepts} em uma solução completa e verificável.`, localOrder: lessonOrder + 5, globalOrder: globalLessonOrder + 5, type: "elite", mergedValidators: validators(pair.map(({ id }) => id)) }),
      ];
      block.push(...generated);
      pair.forEach((item, index) => {
        statements.push(`UPDATE missions SET sort_order=${globalLessonOrder + index + 1},next_mission_slug=${esc(block[index + 1].slug)} WHERE id=${item.id};`);
        statements.push(`UPDATE mission_battle_configs SET zone_id=${zone.id},zone_slug=(SELECT slug FROM campaign_zones WHERE id=${zone.id}),enemy_type='enemy',enemy_level=${globalLessonOrder + index + 1},sort_order=${lessonOrder + index + 1} WHERE mission_id=${item.id};`);
      });
      for (let index = 0; index < block.length - 1; index += 1) statements.push(`UPDATE missions SET next_mission_slug=${esc(block[index + 1].slug)} WHERE id=${block[index].id};`);
      for (let index = 1; index < block.length; index += 1) statements.push(`INSERT INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${block[index].id},${block[index - 1].id});`);

      const body = {
        introduction: `Estude ${concepts} antes das cinco batalhas deste bloco de ${course.name}.`,
        sections: [
          { title: "Conceitos centrais", text: `${moduleTitle} desenvolve ${concepts}. Observe a semântica, o contrato esperado e o motivo de cada escolha.` },
          { title: "Como estudar", text: "Leia o exemplo, reproduza-o com suas palavras e altere uma parte por vez. Depois, feche o material e refaça a ideia sem copiar." },
          { title: "Aplicação profissional", text: "As duas primeiras batalhas apresentam os conceitos; as seguintes reforçam, combinam critérios e cobram uma entrega mais independente." },
        ],
        exampleCode,
        keyPoints: [concepts, "Leitura do objetivo e do contrato", "Prática deliberada sem copiar", "Validação e casos extremos"],
        practiceObjectives: block.map((item, index) => `${index + 1}. ${item.title}`),
        pdfUrl: course.pdf,
        videoUrl: resourceUrl,
        videoLabel: `Conteúdo guiado: ${moduleTitle}`,
        references: [{ label: course.referenceLabel, url: course.referenceRoot }],
      };
      statements.push(`INSERT INTO lessons (id,skill_id,slug,title,body_json,zone_id,prerequisite_mission_id,first_mission_id,sort_order,status) VALUES (${currentLesson},${currentSkill},${esc(`${course.key}-estudo-${moduleSlug}`)},${esc(moduleTitle)},${json(body)},${zone.id},${previousBlockLast?.id ?? "NULL"},${block[0].id},${lessonOrder},'published');`);
      statements.push(`INSERT INTO mission_lesson_prerequisites (mission_id,lesson_id) VALUES (${block[0].id},${currentLesson});`);
      previousBlockLast = block.at(-1);
    }

    const bossSkill = skillId++;
    const bossOrder = zoneIndex * 25 + 25;
    const sourceBoss = mission(zone.existing.at(-1));
    statements.push(`INSERT INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES (${bossSkill},${course.pathId},${esc(`${course.key}2-boss-zona-${zoneIndex + 1}`)},${esc(`Chefe da zona ${zoneIndex + 1}`)},'Integração completa da zona',320,${bossOrder},'published');`);
    const boss = cloneMission({ course, zone, sourceId: sourceBoss.id, skill: bossSkill, slugSuffix: `boss-zona-${zoneIndex + 1}`, title: `Boss: domínio da zona ${zoneIndex + 1}`, objective: `Demonstre domínio integrado de todos os conteúdos da zona ${zoneIndex + 1}.`, localOrder: 25, globalOrder: bossOrder, type: "boss", mergedValidators: validators(zone.existing) });
    statements.push(`INSERT INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${boss.id},${previousBlockLast.id});`);
    statements.push(`UPDATE missions SET next_mission_slug=${esc(boss.slug)} WHERE id=${previousBlockLast.id};`);
    statements.push(`UPDATE campaign_zones SET boss_mission_id=${boss.id} WHERE id=${zone.id};`);
    previousZoneBoss = boss;
  }
}

statements.push("PRAGMA optimize;");
database.close();
await writeFile(join("drizzle", "0016_core_courses_v2.sql"), `-- Generated by scripts/generate-core-courses-v2.mjs\n${statements.join("\n--> statement-breakpoint\n")}\n`);
console.log(`Generated 96 study materials and ${createdMissions} new battles; each core course now has 150 stages.`);
