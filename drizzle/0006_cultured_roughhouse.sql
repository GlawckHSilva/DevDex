CREATE TABLE `battle_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`node_id` integer NOT NULL,
	`status` text NOT NULL,
	`lives_before` integer NOT NULL,
	`lives_after` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_id`) REFERENCES `game_zone_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_battle_attempts_user_node` ON `battle_attempts` (`user_id`,`node_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `game_zone_nodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`zone_id` integer NOT NULL,
	`mission_id` integer,
	`project_id` integer,
	`slug` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`enemy_name` text NOT NULL,
	`enemy_class` text NOT NULL,
	`enemy_sprite` text DEFAULT 'bug-hacker' NOT NULL,
	`mentor_brief` text DEFAULT '' NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`zone_id`) REFERENCES `game_zones`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_zone_nodes_slug_unique` ON `game_zone_nodes` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_game_zone_nodes_zone_order` ON `game_zone_nodes` (`zone_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `game_zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`learning_path_id` integer NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`theme` text DEFAULT 'javascript-city' NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_zones_slug_unique` ON `game_zones` (`slug`);--> statement-breakpoint
CREATE TABLE `player_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar_id` text,
	`mentor_seen` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_battle_states` (
	`user_id` text NOT NULL,
	`node_id` integer NOT NULL,
	`lives` integer DEFAULT 3 NOT NULL,
	`failed_in_battle` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `node_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`node_id`) REFERENCES `game_zone_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zones` (`slug`,`learning_path_id`,`name`,`description`,`theme`,`sort_order`,`status`)
SELECT 'javascript-foundations',id,'JavaScript City · Foundations District','Cinco encontros transformam as missões de JavaScript em uma campanha de lógica, repetição e coleções.','javascript-city',1,'published'
FROM `learning_paths` WHERE `slug`='javascript-fundamentals';
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zone_nodes` (`zone_id`,`mission_id`,`slug`,`kind`,`title`,`enemy_name`,`enemy_class`,`enemy_sprite`,`mentor_brief`,`sort_order`)
SELECT z.id,m.id,'variable-scout','enemy','Registro da Guilda','Variable Scout','Guardião de Variáveis','variable-scout','Variáveis guardam valores para que seu programa possa reutilizá-los. Primeiro nomeie bem o que quer lembrar.',1
FROM `game_zones` z JOIN `missions` m ON m.slug='guardar-nome' WHERE z.slug='javascript-foundations';
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zone_nodes` (`zone_id`,`mission_id`,`slug`,`kind`,`title`,`enemy_name`,`enemy_class`,`enemy_sprite`,`mentor_brief`,`sort_order`)
SELECT z.id,m.id,'branch-hacker','enemy','Portão Condicional','Branch Hacker','Hacker de Condições','branch-hacker','Booleanos e condicionais escolhem o caminho que o programa segue. Leia cada regra com calma.',2
FROM `game_zones` z JOIN `missions` m ON m.slug='verificar-maioridade' WHERE z.slug='javascript-foundations';
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zone_nodes` (`zone_id`,`mission_id`,`slug`,`kind`,`title`,`enemy_name`,`enemy_class`,`enemy_sprite`,`mentor_brief`,`sort_order`)
SELECT z.id,m.id,'loop-bug','enemy','Linha de Montagem','Loop Bug','Operador de Repetições','loop-bug','Repetições evitam copiar e colar lógica. Procure o padrão que precisa acontecer para cada item.',3
FROM `game_zones` z JOIN `missions` m ON m.slug='somar-lista' WHERE z.slug='javascript-foundations';
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zone_nodes` (`zone_id`,`mission_id`,`slug`,`kind`,`title`,`enemy_name`,`enemy_class`,`enemy_sprite`,`mentor_brief`,`sort_order`)
SELECT z.id,m.id,'legacy-dev','elite','Amplificador Corrompido','Legacy Dev','Elite de Código Legado','legacy-dev','Uma função pequena e confiável é melhor que uma solução espalhada. Observe entrada, transformação e retorno.',4
FROM `game_zones` z JOIN `missions` m ON m.slug='calcular-dobro' WHERE z.slug='javascript-foundations';
--> statement-breakpoint
INSERT OR IGNORE INTO `game_zone_nodes` (`zone_id`,`mission_id`,`slug`,`kind`,`title`,`enemy_name`,`enemy_class`,`enemy_sprite`,`mentor_brief`,`sort_order`)
SELECT z.id,m.id,'script-mage','boss','Núcleo dos Cristais','Script Mage','Chefe · Mestre de Arrays','script-mage','O chefe combina seleção e raciocínio. Cada teste privado representa um requisito real da missão.',5
FROM `game_zones` z JOIN `missions` m ON m.slug='filtrar-pares' WHERE z.slug='javascript-foundations';
--> statement-breakpoint
PRAGMA optimize;
