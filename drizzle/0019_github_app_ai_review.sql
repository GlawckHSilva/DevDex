ALTER TABLE `user_project_repositories` ADD `ai_status` text NOT NULL DEFAULT 'unavailable';
--> statement-breakpoint
ALTER TABLE `user_project_repositories` ADD `ai_summary` text;
--> statement-breakpoint
ALTER TABLE `user_project_repositories` ADD `ai_strengths_json` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `user_project_repositories` ADD `ai_improvements_json` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `user_project_repositories` ADD `ai_next_step` text;
--> statement-breakpoint
CREATE TABLE `github_connection_states` (
	`state_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`return_path` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `github_installations` (
	`user_id` text NOT NULL,
	`installation_id` integer NOT NULL,
	`account_login` text NOT NULL,
	`account_type` text NOT NULL,
	`created_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`user_id`, `installation_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
