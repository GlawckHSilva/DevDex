CREATE TABLE `beta_members` (
	`user_id` text PRIMARY KEY NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO `beta_members` (`user_id`) SELECT `user_id` FROM `profiles`;
--> statement-breakpoint
PRAGMA optimize;
