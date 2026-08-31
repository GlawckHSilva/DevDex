import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const technologies = sqliteTable("technologies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const learningPaths = sqliteTable("learning_paths", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  technologyId: integer("technology_id").notNull().references(() => technologies.id),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  version: integer("version").notNull().default(1),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
});

export const campaigns = sqliteTable("campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  technologyId: integer("technology_id").notNull().references(() => technologies.id),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  storyIntro: text("story_intro").notNull(),
  loreTitle: text("lore_title").notNull().default(""),
  loreSubtitle: text("lore_subtitle").notNull().default(""),
  loreSender: text("lore_sender").notNull().default(""),
  loreIntroText: text("lore_intro_text").notNull().default(""),
  loreShortDescription: text("lore_short_description").notNull().default(""),
  loreSignature: text("lore_signature").notNull().default(""),
  loreTransmissionId: text("lore_transmission_id").notNull().default(""),
  theme: text("theme").notNull(),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
  sortOrder: integer("sort_order").notNull(),
  visualConfig: text("visual_config").notNull().default("{}"),
}, (table) => [uniqueIndex("idx_campaigns_learning_path").on(table.learningPathId)]);

export const campaignRecommendations = sqliteTable("campaign_recommendations", {
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  recommendedTechnologyId: integer("recommended_technology_id").notNull().references(() => technologies.id),
  label: text("label").notNull(),
}, (table) => [primaryKey({ columns: [table.campaignId, table.recommendedTechnologyId] })]);

export const skills = sqliteTable("skills", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  xpReward: integer("xp_reward").notNull().default(0),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
}, (table) => [uniqueIndex("idx_skills_path_slug").on(table.learningPathId, table.slug)]);

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  bodyJson: text("body_json").notNull(),
  zoneId: integer("zone_id"),
  prerequisiteMissionId: integer("prerequisite_mission_id"),
  firstMissionId: integer("first_mission_id"),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
});

export const missions = sqliteTable("missions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  briefing: text("briefing").notNull(),
  objective: text("objective").notNull(),
  starterCode: text("starter_code").notNull(),
  functionName: text("function_name").notNull(),
  parametersJson: text("parameters_json").notNull(),
  runtime: text("runtime").notNull().default("javascript"),
  runnerVersion: text("runner_version").notNull().default("javascript-quickjs-1"),
  difficulty: text("difficulty", { enum: ["beginner", "easy", "medium", "hard"] }).notNull().default("beginner"),
  version: integer("version").notNull().default(1),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
  xpReward: integer("xp_reward").notNull(),
  sortOrder: integer("sort_order").notNull(),
  nextMissionSlug: text("next_mission_slug"),
});

export const missionPrerequisites = sqliteTable("mission_prerequisites", {
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  prerequisiteMissionId: integer("prerequisite_mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.missionId, table.prerequisiteMissionId] })]);

export const missionLessonPrerequisites = sqliteTable("mission_lesson_prerequisites", {
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
}, (table) => [primaryKey({ columns: [table.missionId, table.lessonId] })]);

export const missionTests = sqliteTable("mission_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  inputJson: text("input_json").notNull(),
  expectedJson: text("expected_json").notNull(),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull(),
});

export const missionStudyMaterials = sqliteTable("mission_study_materials", {
  missionId: integer("mission_id").primaryKey().references(() => missions.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  introduction: text("introduction").notNull(),
  explanation: text("explanation").notNull(),
  exampleCode: text("example_code").notNull(),
  exampleExplanation: text("example_explanation").notNull(),
  keyPointsJson: text("key_points_json").notNull().default("[]"),
  commonMistakesJson: text("common_mistakes_json").notNull().default("[]"),
  referencesJson: text("references_json").notNull().default("[]"),
});

export const sqlMissionConfigs = sqliteTable("sql_mission_configs", {
  missionId: integer("mission_id").primaryKey().references(() => missions.id, { onDelete: "cascade" }),
  dialect: text("dialect").notNull().default("sqlite"),
  runtimeVersion: text("runtime_version").notNull().default("sqlite-wasm-1"),
  schemaSql: text("schema_sql").notNull(),
  seedSql: text("seed_sql").notNull(),
  starterSql: text("starter_sql").notNull(),
  expectedResultJson: text("expected_result_json").notNull(),
  tableSchemaJson: text("table_schema_json").notNull(),
  tablePreviewJson: text("table_preview_json").notNull(),
  maxRows: integer("max_rows").notNull().default(100),
  timeoutMs: integer("timeout_ms").notNull().default(250),
  maxStatements: integer("max_statements").notNull().default(1),
});

export const webMissionConfigs = sqliteTable("web_mission_configs", {
  missionId: integer("mission_id").primaryKey().references(() => missions.id, { onDelete: "cascade" }),
  documentType: text("document_type", { enum: ["html", "css"] }).notNull(),
  runtimeVersion: text("runtime_version").notNull().default("web-parser-1"),
  starterCode: text("starter_code").notNull(),
  previewHtml: text("preview_html").notNull().default(""),
  previewCss: text("preview_css").notNull().default(""),
  validatorJson: text("validator_json").notNull(),
  maxLength: integer("max_length").notNull().default(8000),
});

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  xpReward: integer("xp_reward").notNull(),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
  introduction: text("introduction").notNull().default(""),
  deadlineDays: integer("deadline_days").notNull().default(7),
  minLevel: integer("min_level").notNull().default(1),
  requiredMaterials: integer("required_materials").notNull().default(0),
  requiredBattles: integer("required_battles").notNull().default(0),
});

export const projectSteps = sqliteTable("project_steps", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  briefing: text("briefing").notNull(),
  objective: text("objective").notNull(),
  activeFile: text("active_file").notNull(),
  requirementsJson: text("requirements_json").notNull(),
  validatorJson: text("validator_json").notNull(),
  xpReward: integer("xp_reward").notNull(),
  sortOrder: integer("sort_order").notNull(),
});

export const projectFiles = sqliteTable("project_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  language: text("language", { enum: ["html", "css", "javascript"] }).notNull(),
  starterCode: text("starter_code").notNull(),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [uniqueIndex("idx_project_files_project_path").on(table.projectId, table.path)]);

export const campaignZones = sqliteTable("campaign_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  storyIntro: text("story_intro").notNull(),
  storyOutro: text("story_outro").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
  status: text("status", { enum: ["draft", "published", "deprecated"] }).notNull().default("published"),
  backgroundAsset: text("background_asset"),
  bossMissionId: integer("boss_mission_id").references(() => missions.id),
  bossProjectId: integer("boss_project_id").references(() => projects.id),
}, (table) => [uniqueIndex("idx_campaign_zones_campaign_slug").on(table.campaignId, table.slug)]);

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const betaMembers = sqliteTable("beta_members", {
  userId: text("user_id").primaryKey(),
  joinedAt: text("joined_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userCharacters = sqliteTable("user_characters", {
  userId: text("user_id").primaryKey().references(() => profiles.userId, { onDelete: "cascade" }),
  archetype: text("archetype", { enum: ["adventurer", "adventuress"] }).notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const missionBattleConfigs = sqliteTable("mission_battle_configs", {
  missionId: integer("mission_id").primaryKey().references(() => missions.id, { onDelete: "cascade" }),
  zoneId: integer("zone_id").references(() => campaignZones.id),
  zoneSlug: text("zone_slug").notNull(),
  enemyName: text("enemy_name").notNull(),
  enemyType: text("enemy_type", { enum: ["enemy", "elite", "boss"] }).notNull().default("enemy"),
  enemyLevel: integer("enemy_level").notNull().default(1),
  hint: text("hint").notNull(),
  enemyIntro: text("enemy_intro").notNull().default(""),
  battleDialogue: text("battle_dialogue").notNull().default(""),
  bossIntro: text("boss_intro").notNull().default(""),
  bossVictory: text("boss_victory").notNull().default(""),
  sortOrder: integer("sort_order").notNull(),
}, (table) => [index("idx_battle_configs_zone_order").on(table.zoneId, table.sortOrder)]);

export const userBattles = sqliteTable("user_battles", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  state: text("state", { enum: ["active", "defeated", "completed"] }).notNull().default("active"),
  lives: integer("lives").notNull().default(3),
  researches: integer("researches").notNull().default(0),
  defeats: integer("defeats").notNull().default(0),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.missionId] })]);

export const battleEvents = sqliteTable("battle_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  action: text("action", { enum: ["test", "attack", "research", "revive"] }).notNull(),
  outcome: text("outcome", { enum: ["passed", "progress", "failed", "error", "shown", "reset"] }).notNull(),
  livesAfter: integer("lives_after").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_battle_events_user_created").on(table.userId, table.createdAt)]);

export const userLearningPaths = sqliteTable("user_learning_paths", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  loreSeenAt: text("lore_seen_at"),
}, (table) => [primaryKey({ columns: [table.userId, table.learningPathId] })]);

export const userLessons = sqliteTable("user_lessons", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  state: text("state", { enum: ["completed"] }).notNull().default("completed"),
  completedAt: text("completed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.lessonId] })]);

export const userMissions = sqliteTable("user_missions", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  state: text("state", { enum: ["available", "in_progress", "completed"] }).notNull().default("available"),
  attempts: integer("attempts").notNull().default(0),
  awardedXp: integer("awarded_xp").notNull().default(0),
  completedAt: text("completed_at"),
}, (table) => [primaryKey({ columns: [table.userId, table.missionId] })]);

export const userProjectProgress = sqliteTable("user_project_progress", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  currentStepId: integer("current_step_id").references(() => projectSteps.id),
  state: text("state", { enum: ["available", "in_progress", "completed"] }).notNull().default("available"),
  completedSteps: integer("completed_steps").notNull().default(0),
  awardedXp: integer("awarded_xp").notNull().default(0),
  completedAt: text("completed_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.projectId] })]);

export const userProjectSteps = sqliteTable("user_project_steps", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  stepId: integer("step_id").notNull().references(() => projectSteps.id, { onDelete: "cascade" }),
  state: text("state", { enum: ["in_progress", "completed"] }).notNull().default("in_progress"),
  attempts: integer("attempts").notNull().default(0),
  awardedXp: integer("awarded_xp").notNull().default(0),
  completedAt: text("completed_at"),
}, (table) => [primaryKey({ columns: [table.userId, table.stepId] })]);

export const projectXpHistory = sqliteTable("project_xp_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  stepId: integer("step_id").notNull().references(() => projectSteps.id),
  amount: integer("amount").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_project_xp_user_step").on(table.userId, table.stepId)]);

export const projectSubmissions = sqliteTable("project_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  stepId: integer("step_id").notNull().references(() => projectSteps.id),
  status: text("status", { enum: ["passed", "failed", "error"] }).notNull(),
  sourceHash: text("source_hash").notNull(),
  durationMs: integer("duration_ms").notNull(),
  passedTests: integer("passed_tests").notNull().default(0),
  failedTests: integer("failed_tests").notNull().default(0),
  errorType: text("error_type"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_project_submissions_user_created").on(table.userId, table.createdAt)]);

export const userSkillProgress = sqliteTable("user_skill_progress", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  mastery: integer("mastery").notNull().default(0),
  successfulAttempts: integer("successful_attempts").notNull().default(0),
  failedAttempts: integer("failed_attempts").notNull().default(0),
}, (table) => [primaryKey({ columns: [table.userId, table.skillId] })]);

export const userXpHistory = sqliteTable("user_xp_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("idx_xp_user_mission").on(table.userId, table.missionId)]);

export const submissions = sqliteTable("submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  mode: text("mode", { enum: ["run", "test"] }).notNull(),
  status: text("status", { enum: ["passed", "failed", "error"] }).notNull(),
  codeHash: text("code_hash").notNull(),
  runtime: text("runtime").notNull().default("javascript"),
  runnerVersion: text("runner_version").notNull().default("javascript-quickjs-1"),
  durationMs: integer("duration_ms").notNull(),
  passedTests: integer("passed_tests").notNull().default(0),
  failedTests: integer("failed_tests").notNull().default(0),
  resultRows: integer("result_rows").notNull().default(0),
  errorType: text("error_type"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_submissions_user_created").on(table.userId, table.createdAt)]);
