CREATE TABLE `learning_paths` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`technology_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	FOREIGN KEY (`technology_id`) REFERENCES `technologies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_paths_slug_unique` ON `learning_paths` (`slug`);--> statement-breakpoint
CREATE TABLE `mission_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mission_id` integer NOT NULL,
	`name` text NOT NULL,
	`input_json` text NOT NULL,
	`expected_json` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`briefing` text NOT NULL,
	`objective` text NOT NULL,
	`starter_code` text NOT NULL,
	`function_name` text NOT NULL,
	`parameters_json` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`next_mission_slug` text,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `missions_slug_unique` ON `missions` (`slug`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`total_xp` integer DEFAULT 0 NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`learning_path_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_skills_path_slug` ON `skills` (`learning_path_id`,`slug`);--> statement-breakpoint
CREATE TABLE `technologies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `technologies_slug_unique` ON `technologies` (`slug`);--> statement-breakpoint
CREATE TABLE `user_missions` (
	`user_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`state` text DEFAULT 'available' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`awarded_xp` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`user_id`, `mission_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_skill_progress` (
	`user_id` text NOT NULL,
	`skill_id` integer NOT NULL,
	`mastery` integer DEFAULT 0 NOT NULL,
	`successful_attempts` integer DEFAULT 0 NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`user_id`, `skill_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_xp_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_xp_user_mission` ON `user_xp_history` (`user_id`,`mission_id`);
--> statement-breakpoint
CREATE INDEX `idx_user_missions_user_state` ON `user_missions` (`user_id`,`state`);
--> statement-breakpoint
CREATE INDEX `idx_mission_tests_mission_sort` ON `mission_tests` (`mission_id`,`sort_order`);
--> statement-breakpoint
CREATE INDEX `idx_missions_skill_sort` ON `missions` (`skill_id`,`sort_order`);
--> statement-breakpoint
INSERT INTO `technologies` (`id`,`slug`,`name`) VALUES (1,'javascript','JavaScript');
--> statement-breakpoint
INSERT INTO `learning_paths` (`id`,`technology_id`,`slug`,`name`,`description`) VALUES (1,1,'javascript-fundamentals','JavaScript Fundamentals','Aprenda lógica resolvendo missões com código real.');
--> statement-breakpoint
INSERT INTO `skills` (`id`,`learning_path_id`,`slug`,`name`,`sort_order`) VALUES (1,1,'functions','Funções',1),(2,1,'conditions','Condições',2);
--> statement-breakpoint
INSERT INTO `missions` (`id`,`skill_id`,`slug`,`title`,`briefing`,`objective`,`starter_code`,`function_name`,`parameters_json`,`xp_reward`,`sort_order`,`next_mission_slug`) VALUES
  (1,1,'somar-dois-numeros','O contador da guilda','O contador precisa somar dois valores de uma negociação sem alterar os dados recebidos.','Implemente somar(a, b) e retorne a soma dos dois números.','function somar(a, b) {\n  return 0;\n}','somar','["a","b"]',120,1,'verificar-maioridade'),
  (2,2,'verificar-maioridade','A entrada da arena','O guarda precisa liberar apenas aventureiros com 18 anos ou mais.','Implemente podeEntrar(idade) e retorne true quando idade for maior ou igual a 18.','function podeEntrar(idade) {\n  return false;\n}','podeEntrar','["idade"]',140,2,NULL);
--> statement-breakpoint
INSERT INTO `mission_tests` (`mission_id`,`name`,`input_json`,`expected_json`,`sort_order`) VALUES
  (1,'soma dois valores positivos','[2,3]','5',1),
  (1,'aceita zero','[0,8]','8',2),
  (1,'soma valores negativos','[-4,-6]','-10',3),
  (2,'libera aos 18 anos','[18]','true',1),
  (2,'bloqueia menores de idade','[17]','false',2),
  (2,'libera adultos','[32]','true',3);
--> statement-breakpoint
PRAGMA optimize;
