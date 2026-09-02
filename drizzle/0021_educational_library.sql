CREATE TABLE `educational_contents` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `technology_id` integer NOT NULL,
  `learning_path_id` integer NOT NULL,
  `zone_id` integer,
  `skill_id` integer,
  `lesson_id` integer,
  `related_mission_id` integer,
  `related_project_id` integer,
  `slug` text NOT NULL,
  `content_type` text DEFAULT 'reference' NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `theory` text DEFAULT '' NOT NULL,
  `syntax` text DEFAULT '' NOT NULL,
  `parameters_json` text DEFAULT '[]' NOT NULL,
  `return_description` text DEFAULT '' NOT NULL,
  `when_to_use` text DEFAULT '' NOT NULL,
  `common_mistakes_json` text DEFAULT '[]' NOT NULL,
  `comparisons_json` text DEFAULT '[]' NOT NULL,
  `quiz_json` text DEFAULT '[]' NOT NULL,
  `tags_json` text DEFAULT '[]' NOT NULL,
  `difficulty` text DEFAULT 'beginner' NOT NULL,
  `xp_reward` integer DEFAULT 0 NOT NULL,
  `sort_order` integer NOT NULL,
  `version` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'published' NOT NULL,
  FOREIGN KEY (`technology_id`) REFERENCES `technologies`(`id`),
  FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`),
  FOREIGN KEY (`zone_id`) REFERENCES `campaign_zones`(`id`),
  FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`),
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE cascade,
  FOREIGN KEY (`related_mission_id`) REFERENCES `missions`(`id`),
  FOREIGN KEY (`related_project_id`) REFERENCES `projects`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_educational_contents_slug` ON `educational_contents` (`slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_educational_contents_lesson` ON `educational_contents` (`lesson_id`);
--> statement-breakpoint
CREATE INDEX `idx_educational_contents_path_order` ON `educational_contents` (`learning_path_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `idx_educational_contents_technology_difficulty` ON `educational_contents` (`technology_id`,`difficulty`);
--> statement-breakpoint
CREATE TABLE `content_examples` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `content_id` integer NOT NULL,
  `title` text NOT NULL,
  `code` text NOT NULL,
  `explanation` text DEFAULT '' NOT NULL,
  `example_type` text DEFAULT 'simple' NOT NULL,
  `sort_order` integer NOT NULL,
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_examples_content_order` ON `content_examples` (`content_id`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `content_snippets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `content_id` integer NOT NULL,
  `title` text NOT NULL,
  `language` text NOT NULL,
  `code` text NOT NULL,
  `explanation` text DEFAULT '' NOT NULL,
  `sort_order` integer NOT NULL,
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_content_snippets_content_order` ON `content_snippets` (`content_id`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `content_prerequisites` (
  `content_id` integer NOT NULL,
  `prerequisite_content_id` integer NOT NULL,
  PRIMARY KEY (`content_id`,`prerequisite_content_id`),
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade,
  FOREIGN KEY (`prerequisite_content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_content_favorites` (
  `user_id` text NOT NULL,
  `content_id` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`content_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_content_history` (
  `user_id` text NOT NULL,
  `content_id` integer NOT NULL,
  `view_count` integer DEFAULT 1 NOT NULL,
  `last_viewed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`content_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_content_history_recent` ON `user_content_history` (`user_id`,`last_viewed_at`);
--> statement-breakpoint
INSERT INTO `educational_contents` (`technology_id`,`learning_path_id`,`zone_id`,`skill_id`,`lesson_id`,`related_mission_id`,`slug`,`content_type`,`title`,`description`,`theory`,`syntax`,`when_to_use`,`tags_json`,`difficulty`,`sort_order`,`version`,`status`)
SELECT lp.technology_id,lp.id,l.zone_id,l.skill_id,l.id,l.first_mission_id,'referencia-' || l.slug,'reference',l.title,
  COALESCE(json_extract(l.body_json,'$.introduction'),''),
  COALESCE(json_extract(l.body_json,'$.sections[0].text'),json_extract(l.body_json,'$.introduction'),''),
  COALESCE(json_extract(l.body_json,'$.exampleCode'),''),
  'Consulte antes da missão relacionada ou durante uma revisão.',
  json_array(t.slug,s.slug),
  CASE WHEN cz.sort_order<=2 THEN 'beginner' WHEN cz.sort_order<=4 THEN 'intermediate' WHEN cz.sort_order=5 THEN 'advanced' ELSE 'professional' END,
  (cz.sort_order*1000)+l.sort_order,lp.version,l.status
FROM lessons l
JOIN skills s ON s.id=l.skill_id
JOIN learning_paths lp ON lp.id=s.learning_path_id
JOIN technologies t ON t.id=lp.technology_id
LEFT JOIN campaign_zones cz ON cz.id=l.zone_id
WHERE l.status='published';
--> statement-breakpoint
INSERT INTO `content_snippets` (`content_id`,`title`,`language`,`code`,`explanation`,`sort_order`)
SELECT ec.id,'Base para consulta',t.slug,COALESCE(json_extract(l.body_json,'$.exampleCode'),''),
  'Snippet reutilizável ligado ao conteúdo e à batalha correspondente.',1
FROM educational_contents ec
JOIN lessons l ON l.id=ec.lesson_id
JOIN technologies t ON t.id=ec.technology_id
WHERE COALESCE(json_extract(l.body_json,'$.exampleCode'),'')<>'';
--> statement-breakpoint
PRAGMA optimize;
