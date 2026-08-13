CREATE TABLE `lessons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`skill_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`body_json` text NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	FOREIGN KEY (`skill_id`) REFERENCES `skills`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `lessons_slug_unique` ON `lessons` (`slug`);--> statement-breakpoint
CREATE TABLE `mission_prerequisites` (
	`mission_id` integer NOT NULL,
	`prerequisite_mission_id` integer NOT NULL,
	PRIMARY KEY(`mission_id`, `prerequisite_mission_id`),
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`prerequisite_mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user_learning_paths` (
	`user_id` text NOT NULL,
	`learning_path_id` integer NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `learning_path_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `learning_paths` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `learning_paths` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `mission_tests` ADD `is_private` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `runtime` text DEFAULT 'javascript' NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `runner_version` text DEFAULT 'javascript-quickjs-1' NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `difficulty` text DEFAULT 'beginner' NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `version` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `missions` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `description` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `xp_reward` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `skills` ADD `status` text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `runtime` text DEFAULT 'javascript' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `runner_version` text DEFAULT 'javascript-quickjs-1' NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `passed_tests` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `failed_tests` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `submissions` ADD `error_type` text;
--> statement-breakpoint
UPDATE `skills` SET `slug`='variables',`name`='Variáveis',`description`='Declarar e usar valores.',`xp_reward`=100,`sort_order`=1 WHERE `id`=1;
--> statement-breakpoint
UPDATE `skills` SET `slug`='conditions',`name`='Condições',`description`='Tomar decisões com expressões booleanas.',`xp_reward`=100,`sort_order`=2 WHERE `id`=2;
--> statement-breakpoint
INSERT OR IGNORE INTO `skills` (`id`,`learning_path_id`,`slug`,`name`,`description`,`xp_reward`,`sort_order`,`status`) VALUES
  (3,1,'loops','Loops','Percorrer coleções com repetição controlada.',120,3,'published'),
  (4,1,'functions','Funções','Encapsular comportamento reutilizável.',120,4,'published'),
  (5,1,'arrays','Arrays','Transformar coleções ordenadas.',140,5,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `lessons` (`id`,`skill_id`,`slug`,`title`,`body_json`,`sort_order`,`status`) VALUES
  (1,1,'variables-intro','Valores com nome','{"summary":"Variáveis guardam valores para reutilização."}',1,'published'),
  (2,2,'conditions-intro','Decisões no código','{"summary":"Condições escolhem caminhos a partir de valores booleanos."}',1,'published'),
  (3,3,'loops-intro','Repetição controlada','{"summary":"Loops percorrem dados sem duplicar instruções."}',1,'published'),
  (4,4,'functions-intro','Blocos reutilizáveis','{"summary":"Funções recebem entradas e produzem resultados."}',1,'published'),
  (5,5,'arrays-intro','Coleções em ordem','{"summary":"Arrays agrupam valores e oferecem operações de transformação."}',1,'published');
--> statement-breakpoint
UPDATE `missions` SET `skill_id`=1,`slug`='guardar-nome',`title`='O nome do aventureiro',
  `briefing`='O registro da guilda precisa criar uma saudação usando o nome recebido.',
  `objective`='Implemente criarSaudacao(nome) e retorne Olá, nome!',
  `starter_code`='function criarSaudacao(nome) {\n  return "";\n}',`function_name`='criarSaudacao',`parameters_json`='["nome"]',
  `xp_reward`=100,`sort_order`=1,`next_mission_slug`='verificar-maioridade' WHERE `id`=1;
--> statement-breakpoint
UPDATE `missions` SET `skill_id`=2,`xp_reward`=100,`sort_order`=2,`next_mission_slug`='somar-lista' WHERE `id`=2;
--> statement-breakpoint
INSERT OR IGNORE INTO `missions` (`id`,`skill_id`,`slug`,`title`,`briefing`,`objective`,`starter_code`,`function_name`,`parameters_json`,`runtime`,`runner_version`,`difficulty`,`version`,`status`,`xp_reward`,`sort_order`,`next_mission_slug`) VALUES
  (3,3,'somar-lista','O inventário da expedição','Some todos os valores recebidos no inventário.','Implemente somarLista(valores) usando repetição e retorne o total.','function somarLista(valores) {\n  let total = 0;\n  return total;\n}','somarLista','["valores"]','javascript','javascript-quickjs-1','easy',1,'published',120,3,'calcular-dobro'),
  (4,4,'calcular-dobro','O amplificador arcano','O amplificador precisa dobrar qualquer energia recebida.','Implemente dobro(numero) e retorne o valor multiplicado por dois.','function dobro(numero) {\n  return 0;\n}','dobro','["numero"]','javascript','javascript-quickjs-1','easy',1,'published',120,4,'filtrar-pares'),
  (5,5,'filtrar-pares','A seleção dos cristais','Selecione apenas os cristais representados por números pares.','Implemente pares(valores) e retorne um novo array somente com números pares.','function pares(valores) {\n  return [];\n}','pares','["valores"]','javascript','javascript-quickjs-1','medium',1,'published',140,5,NULL);
--> statement-breakpoint
DELETE FROM `mission_tests` WHERE `mission_id` IN (1,2,3,4,5);
--> statement-breakpoint
INSERT INTO `mission_tests` (`mission_id`,`name`,`input_json`,`expected_json`,`is_private`,`sort_order`) VALUES
  (1,'saúda Ana','["Ana"]','"Olá, Ana!"',true,1),(1,'saúda Dev','["Dev"]','"Olá, Dev!"',true,2),
  (2,'libera aos 18 anos','[18]','true',true,1),(2,'bloqueia menores','[17]','false',true,2),(2,'libera adultos','[32]','true',true,3),
  (3,'soma positivos','[[2,3,5]]','10',true,1),(3,'aceita lista vazia','[[]]','0',true,2),(3,'soma negativos','[[-2,4,-1]]','1',true,3),
  (4,'dobra positivo','[6]','12',true,1),(4,'dobra zero','[0]','0',true,2),(4,'dobra negativo','[-3]','-6',true,3),
  (5,'filtra pares','[[1,2,3,4]]','[2,4]',true,1),(5,'lista sem pares','[[1,3,5]]','[]',true,2),(5,'preserva zero','[[0,2,-3]]','[0,2]',true,3);
--> statement-breakpoint
INSERT OR IGNORE INTO `mission_prerequisites` (`mission_id`,`prerequisite_mission_id`) VALUES (2,1),(3,2),(4,3),(5,4);
--> statement-breakpoint
INSERT OR IGNORE INTO `user_learning_paths` (`user_id`,`learning_path_id`) SELECT `user_id`,1 FROM `profiles`;
--> statement-breakpoint
PRAGMA optimize;
