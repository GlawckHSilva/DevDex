CREATE TABLE `user_project_repositories` (
	`user_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`repository_url` text NOT NULL,
	`owner` text NOT NULL,
	`repo` text NOT NULL,
	`branch` text NOT NULL,
	`latest_commit_sha` text,
	`review_status` text NOT NULL DEFAULT 'linked',
	`passed_tests` integer NOT NULL DEFAULT 0,
	`failed_tests` integer NOT NULL DEFAULT 0,
	`reviewed_at` text,
	`updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
