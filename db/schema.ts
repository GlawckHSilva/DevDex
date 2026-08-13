import { boolean, integer, jsonb, pgEnum, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const contentStatus = pgEnum("content_status", ["draft", "review", "published", "deprecated"]);
export const missionType = pgEnum("mission_type", ["tutorial", "coding_challenge", "bug_hunt", "support", "project", "boss"]);
export const difficulty = pgEnum("difficulty", ["beginner", "easy", "medium", "hard", "expert"]);
export const runtime = pgEnum("runtime", ["html_css", "javascript", "sql"]);
export const missionState = pgEnum("mission_state", ["available", "in_progress", "completed"]);

const audit = { createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow() };

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), displayName: text("display_name").notNull(), avatarUrl: text("avatar_url"), level: integer("level").notNull().default(1), totalXp: integer("total_xp").notNull().default(0), streakDays: integer("streak_days").notNull().default(0), lastStudyDate: timestamp("last_study_date", { withTimezone: true }), ...audit,
});

export const technologies = pgTable("technologies", {
  id: uuid("id").primaryKey().defaultRandom(), slug: text("slug").notNull().unique(), name: text("name").notNull(), description: text("description").notNull(), icon: text("icon"), sortOrder: integer("sort_order").notNull().default(0), status: contentStatus("status").notNull().default("draft"), ...audit,
});

export const curriculumVersions = pgTable("curriculum_versions", {
  id: uuid("id").primaryKey().defaultRandom(), technologyId: uuid("technology_id").notNull().references(() => technologies.id), version: text("version").notNull(), supportedVersion: text("supported_version"), currentKnownVersion: text("current_known_version"), lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }), status: contentStatus("status").notNull().default("draft"), ...audit,
}, (table) => [uniqueIndex("curriculum_version_unique").on(table.technologyId, table.version)]);

export const learningPaths = pgTable("learning_paths", {
  id: uuid("id").primaryKey().defaultRandom(), curriculumVersionId: uuid("curriculum_version_id").notNull().references(() => curriculumVersions.id), slug: text("slug").notNull().unique(), name: text("name").notNull(), description: text("description").notNull(), sortOrder: integer("sort_order").notNull().default(0), status: contentStatus("status").notNull().default("draft"), ...audit,
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(), learningPathId: uuid("learning_path_id").notNull().references(() => learningPaths.id), slug: text("slug").notNull(), name: text("name").notNull(), description: text("description").notNull(), xpReward: integer("xp_reward").notNull().default(0), sortOrder: integer("sort_order").notNull().default(0), status: contentStatus("status").notNull().default("draft"), ...audit,
}, (table) => [uniqueIndex("skill_path_slug_unique").on(table.learningPathId, table.slug)]);

export const skillPrerequisites = pgTable("skill_prerequisites", {
  skillId: uuid("skill_id").notNull().references(() => skills.id), prerequisiteSkillId: uuid("prerequisite_skill_id").notNull().references(() => skills.id), minimumMastery: integer("minimum_mastery").notNull().default(75),
}, (table) => [primaryKey({ columns: [table.skillId, table.prerequisiteSkillId] })]);

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(), skillId: uuid("skill_id").notNull().references(() => skills.id), slug: text("slug").notNull(), title: text("title").notNull(), body: jsonb("body").notNull(), sortOrder: integer("sort_order").notNull().default(0), status: contentStatus("status").notNull().default("draft"), ...audit,
}, (table) => [uniqueIndex("lesson_skill_slug_unique").on(table.skillId, table.slug)]);

export const missions = pgTable("missions", {
  id: uuid("id").primaryKey().defaultRandom(), skillId: uuid("skill_id").notNull().references(() => skills.id), lessonId: uuid("lesson_id").references(() => lessons.id), slug: text("slug").notNull().unique(), title: text("title").notNull(), briefing: text("briefing").notNull(), instructions: jsonb("instructions").notNull(), starterCode: text("starter_code").notNull().default(""), runtime: runtime("runtime").notNull(), type: missionType("type").notNull(), difficulty: difficulty("difficulty").notNull(), xpReward: integer("xp_reward").notNull(), timeLimitMs: integer("time_limit_ms").notNull().default(5000), sortOrder: integer("sort_order").notNull().default(0), status: contentStatus("status").notNull().default("draft"), ...audit,
});

export const missionTests = pgTable("mission_tests", {
  id: uuid("id").primaryKey().defaultRandom(), missionId: uuid("mission_id").notNull().references(() => missions.id, { onDelete: "cascade" }), name: text("name").notNull(), source: text("source").notNull(), isPrivate: boolean("is_private").notNull().default(true), sortOrder: integer("sort_order").notNull().default(0), ...audit,
});

export const userLearningPaths = pgTable("user_learning_paths", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), learningPathId: uuid("learning_path_id").notNull().references(() => learningPaths.id), startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.learningPathId] })]);

export const userSkillProgress = pgTable("user_skill_progress", {
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), skillId: uuid("skill_id").notNull().references(() => skills.id), mastery: integer("mastery").notNull().default(0), successfulAttempts: integer("successful_attempts").notNull().default(0), failedAttempts: integer("failed_attempts").notNull().default(0), lastPracticedAt: timestamp("last_practiced_at", { withTimezone: true }), nextReviewAt: timestamp("next_review_at", { withTimezone: true }), ...audit,
}, (table) => [primaryKey({ columns: [table.userId, table.skillId] })]);

export const userMissions = pgTable("user_missions", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), missionId: uuid("mission_id").notNull().references(() => missions.id), state: missionState("state").notNull().default("available"), attempts: integer("attempts").notNull().default(0), hintsUsed: integer("hints_used").notNull().default(0), bestScore: real("best_score").notNull().default(0), completedAt: timestamp("completed_at", { withTimezone: true }), ...audit,
}, (table) => [uniqueIndex("user_mission_unique").on(table.userId, table.missionId)]);

export const userXpHistory = pgTable("user_xp_history", {
  id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }), missionId: uuid("mission_id").references(() => missions.id), amount: integer("amount").notNull(), reason: text("reason").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const curriculumSources = pgTable("curriculum_sources", {
  id: uuid("id").primaryKey().defaultRandom(), technologyId: uuid("technology_id").notNull().references(() => technologies.id), url: text("url").notNull(), sourceVersion: text("source_version"), checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(), detectedChange: text("detected_change"), reviewStatus: text("review_status").notNull().default("pending"), ...audit,
});
