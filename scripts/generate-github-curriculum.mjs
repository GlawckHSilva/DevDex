import { readFile, writeFile } from "node:fs/promises";

const [{ courses: [course] }] = await Promise.all([
  JSON.parse(await readFile(new URL("./github-course-outline.json", import.meta.url), "utf8")),
]);
const esc = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => esc(JSON.stringify(value));
const statements = [
  "INSERT OR IGNORE INTO technologies (id,slug,name) VALUES (6,'github','GitHub')",
  "INSERT OR IGNORE INTO learning_paths (id,technology_id,slug,name,description,version,status) VALUES (6,6,'github-fundamentals','GitHub: Forja Colaborativa','24 materiais de estudo e 126 batalhas em 150 etapas, da criação da conta ao uso profissional.',1,'published')",
  `INSERT OR IGNORE INTO campaigns (id,technology_id,learning_path_id,slug,title,subtitle,story_intro,lore_title,lore_subtitle,lore_sender,lore_intro_text,lore_short_description,lore_signature,lore_transmission_id,theme,status,sort_order,visual_config) VALUES (6,6,6,'github-collaboration-forge','Forja Colaborativa','Do primeiro acesso à engenharia colaborativa profissional.','Os arquivos do conhecimento foram separados em versões conflitantes. Reconstrua a rede de colaboração e restaure seu histórico.','Forja Colaborativa','PROTOCOLO · VERSÃO, COLABORAÇÃO E ENTREGA','Mestre Octavia','A rede que conecta os construtores foi fragmentada. Proteja sua identidade, domine o histórico e automatize entregas para restaurar a colaboração.','Da criação segura da conta ao GitHub profissional.','— Mestre Octavia','GH-FORGE-006','repository-forge','published',0,'{}')`,
];

let skillId = 8000;
let lessonId = 7000;
let missionId = 9000;
let battleOrder = 0;
let previousMissionId = null;

for (const [zoneIndex, zone] of course.zones.entries()) {
  const zoneId = 31 + zoneIndex;
  statements.push(`INSERT OR IGNORE INTO campaign_zones (id,campaign_id,slug,title,story_intro,story_outro,sort_order,status,background_asset) VALUES (${zoneId},6,${esc(zone.slug)},${esc(zone.title)},${esc(zone.intro)},${esc(`${zone.title} restaurada.`)},${zoneIndex + 1},'published','/campaigns/sql/arquivo-perdido-v1.png')`);
  let zoneOrder = 0;

  for (const courseModule of zone.modules) {
    skillId += 1;
    lessonId += 1;
    const moduleMissionIds = courseModule.practices.map(() => ++missionId);
    const lessonSort = ++zoneOrder;
    statements.push(`INSERT OR IGNORE INTO skills (id,learning_path_id,slug,name,description,xp_reward,sort_order,status) VALUES (${skillId},6,${esc(`gh-${courseModule.slug}`)},${esc(courseModule.title)},${esc(courseModule.concepts)},0,${skillId - 8000},'published')`);

    const body = {
      introduction: `Estude ${courseModule.concepts} antes de iniciar as cinco batalhas deste bloco.`,
      sections: [
        { title: "Conceitos centrais", text: `${courseModule.title} cobre ${courseModule.concepts}. Aprenda a intenção de cada comando ou configuração antes de executá-lo em um projeto real.` },
        { title: "Prática segura", text: "Use repositórios de treino, revise o estado antes de alterar o histórico e nunca cole tokens, chaves privadas ou segredos no editor ou em commits." },
        { title: "Aplicação profissional", text: "As batalhas avançam de uma ação isolada para sequências reproduzíveis, revisão, automação e diagnóstico de situações reais." },
      ],
      exampleCode: courseModule.example,
      keyPoints: [courseModule.concepts, "Comandos previsíveis e reversíveis", "Segredos nunca entram no repositório", "Revisão do estado antes de publicar"],
      practiceObjectives: courseModule.practices.map(([title], index) => `${index + 1}. ${title}`),
      pdfUrl: course.pdf,
      videoUrl: "https://skills.github.com/",
      videoLabel: "Laboratório oficial GitHub Skills",
      references: [{ label: courseModule.title, url: courseModule.resource }, { label: course.referenceLabel, url: course.referenceRoot }],
    };
    statements.push(`INSERT OR IGNORE INTO lessons (id,skill_id,slug,title,body_json,zone_id,prerequisite_mission_id,first_mission_id,sort_order,status) VALUES (${lessonId},${skillId},${esc(`github-estudo-${courseModule.slug}`)},${esc(courseModule.title)},${json(body)},${zoneId},${previousMissionId ?? "NULL"},${moduleMissionIds[0]},${lessonSort},'published')`);

    for (const [practiceIndex, [title, answer]] of courseModule.practices.entries()) {
      const id = moduleMissionIds[practiceIndex];
      battleOrder += 1;
      zoneOrder += 1;
      const lines = answer.split("\n").map((line) => line.trim()).filter(Boolean);
      const difficulty = zoneIndex < 1 ? "beginner" : zoneIndex < 3 ? "easy" : zoneIndex < 5 ? "medium" : "hard";
      const xp = 100 + zoneIndex * 20 + (practiceIndex === 4 ? 25 : 0);
      const next = practiceIndex < 4 ? `github-${courseModule.slug}-${practiceIndex + 2}` : null;
      const objective = `Escreva a solução correta para “${title}”. Use somente dados fictícios; nunca informe tokens, senhas ou chaves privadas.`;
      statements.push(`INSERT OR IGNORE INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug) VALUES (${id},${skillId},${esc(`github-${courseModule.slug}-${practiceIndex + 1}`)},${esc(title)},'Batalha prática de GitHub baseada no material anterior.',${esc(objective)},'','terminal','{}','github','github-validator-1',${esc(difficulty)},1,'published',${xp},${battleOrder},${next ? esc(next) : "NULL"})`);
      const midpoint = Math.max(1, Math.ceil(lines.length / 2));
      const tests = [
        ["Comando ou configuração principal", { all: lines.slice(0, midpoint) }],
        ["Parâmetros e valores necessários", { all: lines.slice(midpoint).length ? lines.slice(midpoint) : lines }],
        ["Sequência completa na ordem correta", { ordered: lines }],
      ];
      for (const [testIndex, [name, rule]] of tests.entries()) statements.push(`INSERT OR IGNORE INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) VALUES (${id},${esc(name)},'[]',${json(rule)},1,${testIndex + 1})`);
      const enemyType = practiceIndex === 4 ? "elite" : "enemy";
      const enemyName = practiceIndex === 4 ? `Sentinela de ${courseModule.title}` : `Bug de ${title}`;
      statements.push(`INSERT OR IGNORE INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order) VALUES (${id},${zoneId},${esc(zone.slug)},${esc(enemyName)},${esc(enemyType)},${battleOrder},${esc(`Revise ${courseModule.title} e escreva os comandos ou a configuração em linhas separadas.`)},${esc(`Uma falha corrompeu ${title.toLowerCase()}.`)},'Restaure o procedimento sem executar comandos reais no servidor.','','',${zoneOrder})`);
      if (practiceIndex === 0) statements.push(`INSERT OR IGNORE INTO mission_lesson_prerequisites (mission_id,lesson_id) VALUES (${id},${lessonId})`);
      if (previousMissionId !== null) statements.push(`INSERT OR IGNORE INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${id},${previousMissionId})`);
      previousMissionId = id;
    }
  }

  missionId += 1;
  battleOrder += 1;
  zoneOrder += 1;
  const bossId = missionId;
  const bossNames = ["Guardião da Identidade", "Arquivista do Histórico", "Hidra das Branches", "Conselho dos Revisores", "Autômato da Entrega", "Soberano da Governança"];
  const required = zone.modules.map((courseModule) => courseModule.practices[4][1].split("\n")[0]);
  statements.push(`INSERT OR IGNORE INTO missions (id,skill_id,slug,title,briefing,objective,starter_code,function_name,parameters_json,runtime,runner_version,difficulty,version,status,xp_reward,sort_order,next_mission_slug) VALUES (${bossId},${skillId},${esc(`github-chefe-zona-${zoneIndex + 1}`)},${esc(bossNames[zoneIndex])},${esc(`Chefe da zona ${zone.title}.`)},${esc("Combine os quatro blocos da zona em um procedimento profissional. Escreva uma solução válida para cada requisito, sem consultar as respostas anteriores.")},'','terminal','{}','github','github-validator-1','hard',1,'published',${250 + zoneIndex * 30},${battleOrder},NULL)`);
  for (const [testIndex, fragment] of required.entries()) statements.push(`INSERT OR IGNORE INTO mission_tests (mission_id,name,input_json,expected_json,is_private,sort_order) VALUES (${bossId},${esc(`Domínio do bloco ${testIndex + 1}`)},'[]',${json({ all: [fragment] })},1,${testIndex + 1})`);
  statements.push(`INSERT OR IGNORE INTO mission_battle_configs (mission_id,zone_id,zone_slug,enemy_name,enemy_type,enemy_level,hint,enemy_intro,battle_dialogue,boss_intro,boss_victory,sort_order) VALUES (${bossId},${zoneId},${esc(zone.slug)},${esc(bossNames[zoneIndex])},'boss',${battleOrder},'Combine uma prática profissional de cada material da zona.','O chefe protege a passagem para a próxima área.','Prove que domina todo o fluxo da zona.','A integração final começou.','Zona restaurada.',${zoneOrder})`);
  statements.push(`INSERT OR IGNORE INTO mission_prerequisites (mission_id,prerequisite_mission_id) VALUES (${bossId},${previousMissionId})`);
  statements.push(`UPDATE missions SET next_mission_slug=${esc(`github-chefe-zona-${zoneIndex + 1}`)} WHERE id=${previousMissionId}`);
  statements.push(`UPDATE campaign_zones SET boss_mission_id=${bossId} WHERE id=${zoneId}`);
  previousMissionId = bossId;
}

statements.push("INSERT OR IGNORE INTO user_learning_paths (user_id,learning_path_id) SELECT user_id,6 FROM profiles");
await writeFile("drizzle/0020_github_curriculum.sql", `-- Generated by scripts/generate-github-curriculum.mjs\n${statements.join(";\n--> statement-breakpoint\n")};\n`);
console.log(`Generated ${course.zones.length} zones, ${lessonId - 7000} materials and ${missionId - 9000} battles.`);
