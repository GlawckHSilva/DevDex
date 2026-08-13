CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`mode` text NOT NULL,
	`status` text NOT NULL,
	`code_hash` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_submissions_user_created` ON `submissions` (`user_id`,`created_at`);
--> statement-breakpoint
PRAGMA optimize;
