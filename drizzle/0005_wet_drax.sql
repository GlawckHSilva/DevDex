CREATE TABLE `project_files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`path` text NOT NULL,
	`language` text NOT NULL,
	`starter_code` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_project_files_project_path` ON `project_files` (`project_id`,`path`);--> statement-breakpoint
CREATE TABLE `project_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`project_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`briefing` text NOT NULL,
	`objective` text NOT NULL,
	`active_file` text NOT NULL,
	`requirements_json` text NOT NULL,
	`validator_json` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_steps_slug_unique` ON `project_steps` (`slug`);--> statement-breakpoint
CREATE TABLE `project_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`step_id` integer NOT NULL,
	`status` text NOT NULL,
	`source_hash` text NOT NULL,
	`duration_ms` integer NOT NULL,
	`passed_tests` integer DEFAULT 0 NOT NULL,
	`failed_tests` integer DEFAULT 0 NOT NULL,
	`error_type` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`step_id`) REFERENCES `project_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_project_submissions_user_created` ON `project_submissions` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `project_xp_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`step_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`step_id`) REFERENCES `project_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_project_xp_user_step` ON `project_xp_history` (`user_id`,`step_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`xp_reward` integer NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_slug_unique` ON `projects` (`slug`);--> statement-breakpoint
CREATE TABLE `user_project_progress` (
	`user_id` text NOT NULL,
	`project_id` integer NOT NULL,
	`current_step_id` integer,
	`state` text DEFAULT 'available' NOT NULL,
	`completed_steps` integer DEFAULT 0 NOT NULL,
	`awarded_xp` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `project_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`current_step_id`) REFERENCES `project_steps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_project_steps` (
	`user_id` text NOT NULL,
	`step_id` integer NOT NULL,
	`state` text DEFAULT 'in_progress' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`awarded_xp` integer DEFAULT 0 NOT NULL,
	`completed_at` text,
	PRIMARY KEY(`user_id`, `step_id`),
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`step_id`) REFERENCES `project_steps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `projects` (`id`,`slug`,`title`,`description`,`xp_reward`,`sort_order`,`status`) VALUES
  (1,'lista-de-tarefas','Lista de tarefas','Combine HTML, CSS e JavaScript para construir um To-do App funcional.',720,1,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `project_steps` (`id`,`project_id`,`slug`,`title`,`briefing`,`objective`,`active_file`,`requirements_json`,`validator_json`,`xp_reward`,`sort_order`) VALUES
  (1,1,'01-estrutura-html','Estrutura HTML','Comece criando a estrutura semântica que sustenta toda a aplicação.','Monte um formulário com campo, botão de adicionar e lista de tarefas.','index.html','["Existe um formulário","Existe um campo para tarefa","Existe um botão adicionar","Existe uma lista de tarefas"]','{"kind":"html","rules":[{"type":"element","tag":"form","attributes":{"id":"task-form"}},{"type":"element","tag":"input","attributes":{"id":"task-input","type":"text"}},{"type":"element","tag":"button","attributes":{"type":"submit"}},{"type":"element","tag":"ul","attributes":{"id":"task-list"}}]}',100,1),
  (2,1,'02-visual-css','Visual CSS','Transforme a estrutura em um cartão legível e agradável.','Estilize .todo-app com largura, espaço interno, fundo e cantos arredondados.','style.css','["Limita a largura a 480px","Aplica padding de 24px","Usa fundo branco","Arredonda os cantos em 16px"]','{"kind":"css","rules":[{"type":"style","selector":".todo-app","declarations":{"max-width":"480px","padding":"24px","background-color":"#fff","border-radius":"16px"}}]}',120,2),
  (3,1,'03-adicionar-tarefa','Adicionar tarefa','Agora a interface precisa responder ao usuário.','Ao enviar o formulário, crie um li com o texto digitado e adicione-o à lista.','script.js','["Adiciona uma tarefa à lista","Mantém o texto digitado na tarefa"]','{"kind":"javascript","test":"add"}',140,3),
  (4,1,'04-remover-tarefa','Remover tarefa','Toda tarefa criada precisa poder sair da lista.','Inclua um botão em cada li e remova a tarefa quando ele for clicado.','script.js','["Cria uma tarefa com ação de remover","Remove a tarefa ao clicar no botão"]','{"kind":"javascript","test":"remove"}',160,4),
  (5,1,'05-persistencia','Persistência local','A lista deve sobreviver quando a página for recarregada.','Salve as tarefas no localStorage e restaure-as ao iniciar.','script.js','["Salva as tarefas no localStorage","Restaura as tarefas ao iniciar"]','{"kind":"javascript","test":"persist"}',200,5);
--> statement-breakpoint
INSERT OR IGNORE INTO `project_files` (`id`,`project_id`,`path`,`language`,`starter_code`,`sort_order`) VALUES
  (1,1,'index.html','html','<main class="todo-app">\n  <h1>Minha Lista</h1>\n  <!-- Etapa 1: formulário, campo, botão e lista -->\n</main>',1),
  (2,1,'style.css','css','* { box-sizing: border-box; }\nbody {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  font-family: system-ui;\n  background: #e2e8f0;\n}\n\n.todo-app {\n  /* Etapa 2: transforme em um cartão */\n}',2),
  (3,1,'script.js','javascript','// Etapas 3 a 5: adicione interação e persistência.\nconst form = document.getElementById("task-form");\nconst input = document.getElementById("task-input");\nconst list = document.getElementById("task-list");',3);
--> statement-breakpoint
INSERT OR IGNORE INTO `user_project_progress` (`user_id`,`project_id`,`current_step_id`,`state`) SELECT `user_id`,1,1,'available' FROM `profiles`;
--> statement-breakpoint
PRAGMA optimize;
