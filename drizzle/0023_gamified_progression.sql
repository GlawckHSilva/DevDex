ALTER TABLE `profiles` ADD `skill_points_earned` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `profiles` ADD `skill_points_spent` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE `game_balance_settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `game_balance_settings` (`key`,`value`) VALUES
  ('max_hearts',5),('heart_regen_minutes',60),('max_hints',3),('hint_regen_minutes',300),
  ('hint_penalty_percent',10),('minimum_xp_percent',70);
--> statement-breakpoint
CREATE TABLE `user_resources` (
  `user_id` text PRIMARY KEY NOT NULL,
  `hearts` integer DEFAULT 5 NOT NULL,
  `heart_updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `hints` integer DEFAULT 3 NOT NULL,
  `hint_updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `second_chance_used_on` text,
  `last_breath_used_on` text,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `user_resources` (`user_id`) SELECT `user_id` FROM `profiles`;
--> statement-breakpoint
UPDATE `user_battles` SET `lives`=CASE WHEN `lives`=0 THEN 0 ELSE MIN(5,`lives`+2) END;
--> statement-breakpoint
CREATE TABLE `skill_abilities` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `category` text NOT NULL,
  `cost` integer NOT NULL,
  `min_level` integer DEFAULT 1 NOT NULL,
  `max_ranks` integer DEFAULT 1 NOT NULL,
  `effect_key` text NOT NULL,
  `effect_value` integer DEFAULT 0 NOT NULL,
  `icon` text NOT NULL,
  `position_x` integer NOT NULL,
  `position_y` integer NOT NULL,
  `sort_order` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `skill_abilities` (`id`,`name`,`description`,`category`,`cost`,`min_level`,`max_ranks`,`effect_key`,`effect_value`,`icon`,`position_x`,`position_y`,`sort_order`) VALUES
  ('clinical-eye','Olho Clínico','Indica o conceito que merece revisão após um erro.','knowledge',1,2,1,'clinical_eye',1,'◎',50,8,1),
  ('code-memory','Memória de Código','Guarda tentativas e explicações para revisão pessoal.','knowledge',2,3,1,'code_memory',1,'▤',50,34,2),
  ('analyst','Analista','Recomenda revisão quando um assunto acumula erros.','knowledge',2,5,1,'analyst',1,'◇',50,61,3),
  ('bug-reading','Leitura de Bug','Delimita a região provável do problema em Bug Battles.','knowledge',3,8,1,'bug_reading',1,'⌕',50,88,4),
  ('recovery-1','Recuperação I','Reduz a recuperação de corações para 55 minutos.','resilience',1,2,1,'heart_regen_delta',-5,'♥',50,8,1),
  ('recovery-2','Recuperação II','Reduz a recuperação de corações para 50 minutos.','resilience',2,5,1,'heart_regen_delta',-5,'♥',50,34,2),
  ('second-chance','Segunda Chance','O primeiro erro do dia não consome coração.','resilience',3,7,1,'second_chance',1,'⟳',50,61,3),
  ('last-breath','Último Fôlego','Uma vitória diária com 1 coração recupera outro.','resilience',3,10,1,'last_breath',1,'✦',50,88,4),
  ('intuition','Intuição','Mostra o tipo da próxima dica antes do gasto.','strategy',1,2,1,'intuition',1,'◌',50,8,1),
  ('mental-recharge-1','Recarga Mental I','Reduz a recuperação de dicas para 4h30.','strategy',1,3,1,'hint_regen_delta',-30,'💡',50,34,2),
  ('mental-recharge-2','Recarga Mental II','Reduz a recuperação de dicas para 4 horas.','strategy',2,6,1,'hint_regen_delta',-30,'💡',50,61,3),
  ('investigator','Investigador','Oferece orientação conceitual após erros repetidos.','strategy',3,9,1,'investigator',1,'⌁',50,88,4);
--> statement-breakpoint
CREATE TABLE `skill_ability_prerequisites` (
  `skill_id` text NOT NULL,
  `prerequisite_skill_id` text NOT NULL,
  `minimum_rank` integer DEFAULT 1 NOT NULL,
  PRIMARY KEY (`skill_id`,`prerequisite_skill_id`),
  FOREIGN KEY (`skill_id`) REFERENCES `skill_abilities`(`id`) ON DELETE cascade,
  FOREIGN KEY (`prerequisite_skill_id`) REFERENCES `skill_abilities`(`id`) ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `skill_ability_prerequisites` (`skill_id`,`prerequisite_skill_id`,`minimum_rank`) VALUES
  ('code-memory','clinical-eye',1),('analyst','code-memory',1),('bug-reading','analyst',1),
  ('recovery-2','recovery-1',1),('second-chance','recovery-2',1),('last-breath','second-chance',1),
  ('mental-recharge-2','mental-recharge-1',1),('investigator','intuition',1);
--> statement-breakpoint
CREATE TABLE `user_abilities` (
  `user_id` text NOT NULL,
  `skill_id` text NOT NULL,
  `rank` integer DEFAULT 1 NOT NULL,
  `purchased_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`skill_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`skill_id`) REFERENCES `skill_abilities`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `level_up_history` (
  `user_id` text NOT NULL,
  `level` integer NOT NULL,
  `skill_points_granted` integer DEFAULT 1 NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`level`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_ability_purchases` (
  `user_id` text NOT NULL,
  `skill_id` text NOT NULL,
  `rank` integer NOT NULL,
  `cost` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`skill_id`,`rank`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`skill_id`) REFERENCES `skill_abilities`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mission_hints` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `mission_id` integer NOT NULL,
  `hint_level` integer NOT NULL,
  `hint_type` text NOT NULL,
  `content` text NOT NULL,
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_mission_hints_level` ON `mission_hints` (`mission_id`,`hint_level`);
--> statement-breakpoint
INSERT INTO `mission_hints` (`mission_id`,`hint_level`,`hint_type`,`content`)
SELECT mbc.mission_id,1,'concept',COALESCE(NULLIF(mbc.hint,''),'Revise o conceito central apresentado no material desta etapa.') FROM mission_battle_configs mbc;
--> statement-breakpoint
INSERT INTO `mission_hints` (`mission_id`,`hint_level`,`hint_type`,`content`)
SELECT mbc.mission_id,2,'direction','Concentre-se neste objetivo: ' || m.objective FROM mission_battle_configs mbc JOIN missions m ON m.id=mbc.mission_id;
--> statement-breakpoint
INSERT INTO `mission_hints` (`mission_id`,`hint_level`,`hint_type`,`content`)
SELECT mbc.mission_id,3,'similar_example','Use a estrutura do exemplo estudado como referência, adaptando nomes e valores ao objetivo sem copiar uma solução pronta.' FROM mission_battle_configs mbc;
--> statement-breakpoint
CREATE TABLE `user_mission_hints` (
  `user_id` text NOT NULL,
  `mission_id` integer NOT NULL,
  `hint_level` integer NOT NULL,
  `unlocked_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`mission_id`,`hint_level`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `mission_performance` (
  `user_id` text NOT NULL,
  `mission_id` integer NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL,
  `errors` integer DEFAULT 0 NOT NULL,
  `successes` integer DEFAULT 0 NOT NULL,
  `hints_used` integer DEFAULT 0 NOT NULL,
  `completed_without_hints` integer DEFAULT 0 NOT NULL,
  `completed_first_attempt` integer DEFAULT 0 NOT NULL,
  `resolution_ms` integer DEFAULT 0 NOT NULL,
  `started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (`user_id`,`mission_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mission_performance_user_errors` ON `mission_performance` (`user_id`,`errors`);
--> statement-breakpoint
CREATE TABLE `mission_attempt_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL,
  `mission_id` integer NOT NULL,
  `passed` integer NOT NULL,
  `code_hash` text NOT NULL,
  `source_code` text,
  `explanation` text NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_mission_attempt_history_user_mission` ON `mission_attempt_history` (`user_id`,`mission_id`);
--> statement-breakpoint
PRAGMA optimize;
