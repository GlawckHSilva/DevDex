ALTER TABLE `lessons` ADD `zone_id` integer;
--> statement-breakpoint
ALTER TABLE `lessons` ADD `prerequisite_mission_id` integer;
--> statement-breakpoint
ALTER TABLE `lessons` ADD `first_mission_id` integer;
--> statement-breakpoint
CREATE TABLE `mission_lesson_prerequisites` (
  `mission_id` integer NOT NULL,
  `lesson_id` integer NOT NULL,
  PRIMARY KEY(`mission_id`,`lesson_id`),
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_lessons` (
  `user_id` text NOT NULL,
  `lesson_id` integer NOT NULL,
  `state` text DEFAULT 'completed' NOT NULL,
  `completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(`user_id`,`lesson_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_lessons_zone_order` ON `lessons` (`zone_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `idx_user_lessons_user` ON `user_lessons` (`user_id`,`completed_at`);
