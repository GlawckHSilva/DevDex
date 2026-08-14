CREATE TABLE `battle_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`action` text NOT NULL,
	`outcome` text NOT NULL,
	`lives_after` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_battle_events_user_created` ON `battle_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `mission_battle_configs` (
	`mission_id` integer PRIMARY KEY NOT NULL,
	`zone_slug` text NOT NULL,
	`enemy_name` text NOT NULL,
	`enemy_type` text DEFAULT 'enemy' NOT NULL,
	`enemy_level` integer DEFAULT 1 NOT NULL,
	`hint` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_battle_configs_zone_order` ON `mission_battle_configs` (`zone_slug`,`sort_order`);--> statement-breakpoint
CREATE TABLE `user_battles` (
	`user_id` text NOT NULL,
	`mission_id` integer NOT NULL,
	`state` text DEFAULT 'active' NOT NULL,
	`lives` integer DEFAULT 3 NOT NULL,
	`researches` integer DEFAULT 0 NOT NULL,
	`defeats` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `mission_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_characters` (
	`user_id` text PRIMARY KEY NOT NULL,
	`archetype` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `mission_battle_configs` (`mission_id`,`zone_slug`,`enemy_name`,`enemy_type`,`enemy_level`,`hint`,`sort_order`) VALUES
  (1,'bosque-dos-fundamentos','Slime da Sintaxe','enemy',1,'Monte a saudação juntando o texto "Olá, ", o nome recebido e o ponto de exclamação.',1),
  (2,'bosque-dos-fundamentos','Sentinela Booleana','enemy',2,'Compare a idade recebida com o limite necessário usando um operador de comparação.',2),
  (3,'bosque-dos-fundamentos','Golem do Loop','enemy',3,'Crie uma variável acumuladora e percorra todos os valores, somando um por vez.',3),
  (4,'bosque-dos-fundamentos','Mago das Funções','elite',4,'A função deve receber o valor, multiplicá-lo por dois e devolver o resultado.',4),
  (5,'bosque-dos-fundamentos','Hidra dos Arrays','boss',5,'Use filter para manter apenas os números cujo resto da divisão por dois seja zero.',5);
--> statement-breakpoint
PRAGMA optimize;
