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

export const missionTests = sqliteTable("mission_tests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  missionId: integer("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  inputJson: text("input_json").notNull(),
  expectedJson: text("expected_json").notNull(),
  isPrivate: integer("is_private", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull(),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  totalXp: integer("total_xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const userLearningPaths = sqliteTable("user_learning_paths", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  learningPathId: integer("learning_path_id").notNull().references(() => learningPaths.id),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.userId, table.learningPathId] })]);

export const userMissions = sqliteTable("user_missions", {
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  missionId: integer("mission_id").notNull().references(() => missions.id),
  state: text("state", { enum: ["available", "in_progress", "completed"] }).notNull().default("available"),
  attempts: integer("attempts").notNull().default(0),
  awardedXp: integer("awarded_xp").notNull().default(0),
  completedAt: text("completed_at"),
}, (table) => [primaryKey({ columns: [table.userId, table.missionId] })]);

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
  errorType: text("error_type"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_submissions_user_created").on(table.userId, table.createdAt)]);
