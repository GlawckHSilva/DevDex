ALTER TABLE `projects` ADD `introduction` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `projects` ADD `deadline_days` integer NOT NULL DEFAULT 7;
--> statement-breakpoint
ALTER TABLE `projects` ADD `min_level` integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `projects` ADD `required_materials` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `projects` ADD `required_battles` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
CREATE TABLE `user_project_notifications` (
  `user_id` text NOT NULL,
  `project_id` integer NOT NULL,
  `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `seen_at` text,
  PRIMARY KEY(`user_id`,`project_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_notifications_unread` ON `user_project_notifications` (`user_id`,`seen_at`);
--> statement-breakpoint
UPDATE `projects` SET `sort_order`=3,`introduction`='A Guilda DevDex precisa de uma lista de tarefas confiável para organizar missões. Entregue uma aplicação completa, com interação e persistência local.',`deadline_days`=7,`min_level`=3,`required_materials`=6,`required_battles`=18 WHERE `id`=1;
--> statement-breakpoint
INSERT OR IGNORE INTO `projects` (`id`,`slug`,`title`,`description`,`xp_reward`,`sort_order`,`status`,`introduction`,`deadline_days`,`min_level`,`required_materials`,`required_battles`) VALUES
  (2,'cartao-de-perfil','Cartão de perfil','Construa seu primeiro cartão profissional com HTML e CSS.',360,1,'published','A equipe de comunidade precisa apresentar novos aventureiros. Crie um cartão claro, semântico e responsivo para o perfil de uma pessoa.',3,1,1,1),
  (3,'landing-page-produto','Landing page de produto','Transforme uma ideia em uma página de apresentação responsiva.',540,2,'published','Uma pequena empresa precisa validar seu novo produto. Construa uma landing page que explique a proposta, mostre benefícios e convide a pessoa visitante a agir.',5,2,3,8);
--> statement-breakpoint
INSERT OR IGNORE INTO `project_steps` (`id`,`project_id`,`slug`,`title`,`briefing`,`objective`,`active_file`,`requirements_json`,`validator_json`,`xp_reward`,`sort_order`) VALUES
  (6,2,'perfil-01-estrutura','Estrutura do perfil','Comece pela informação que uma pessoa precisa reconhecer de imediato.','Crie um main .profile-card com nome, descrição e uma chamada de contato.','index.html','["Existe o cartão de perfil","Mostra um título","Inclui uma descrição","Tem uma chamada de contato"]','{"kind":"html","rules":[{"type":"element","tag":"main","attributes":{"class":"profile-card"}},{"type":"element","tag":"h1"},{"type":"element","tag":"p"},{"type":"element","tag":"a","attributes":{"href":"#contato"}}]}',100,1),
  (7,2,'perfil-02-estilo','Visual do perfil','Dê hierarquia e espaço para o conteúdo respirar.','Estilize .profile-card como um cartão centralizado e legível.','style.css','["Limita a largura","Aplica espaço interno","Usa fundo claro","Arredonda os cantos"]','{"kind":"css","rules":[{"type":"style","selector":".profile-card","declarations":{"max-width":"420px","padding":"24px","background-color":"#fff","border-radius":"20px"}}]}',120,2),
  (8,2,'perfil-03-responsivo','Entrega responsiva','Garanta que o cartão continue legível em telas pequenas.','Inclua uma regra de media query para telas de até 600px.','style.css','["Inclui uma media query para mobile"]','{"kind":"css","rules":[{"type":"raw","pattern":"@media\\s*\\([^)]*max-width\\s*:\\s*600px"}]}',140,3),
  (9,3,'landing-01-estrutura','Estrutura da página','Organize o conteúdo como uma página de produto real.','Crie header, navegação, main e uma seção de destaque.','index.html','["Existe cabeçalho","Existe navegação","Existe conteúdo principal","Existe seção de destaque"]','{"kind":"html","rules":[{"type":"element","tag":"header"},{"type":"element","tag":"nav"},{"type":"element","tag":"main"},{"type":"element","tag":"section","attributes":{"id":"destaque"}}]}',110,1),
  (10,3,'landing-02-beneficios','Benefícios e chamada','Explique valor antes de pedir uma ação.','Inclua uma lista de benefícios e um botão ou link de chamada.','index.html','["Lista benefícios","Inclui chamada para ação"]','{"kind":"html","rules":[{"type":"element","tag":"ul"},{"type":"element","tag":"a","attributes":{"href":"#contato"}}]}',130,2),
  (11,3,'landing-03-design','Design do destaque','Crie contraste e hierarquia visual no bloco principal.','Estilize #destaque com espaçamento, fundo e cantos arredondados.','style.css','["Aplica espaço interno","Define fundo","Arredonda o destaque"]','{"kind":"css","rules":[{"type":"style","selector":"#destaque","declarations":{"padding":"32px","background-color":"#0f172a","border-radius":"20px"}}]}',150,3),
  (12,3,'landing-04-mobile','Entrega mobile','Finalize a página para telas pequenas.','Inclua uma media query de até 600px que reorganize a navegação.','style.css','["Inclui regra mobile"]','{"kind":"css","rules":[{"type":"raw","pattern":"@media\\s*\\([^)]*max-width\\s*:\\s*600px"}]}',150,4);
--> statement-breakpoint
INSERT OR IGNORE INTO `project_files` (`id`,`project_id`,`path`,`language`,`starter_code`,`sort_order`) VALUES
  (4,2,'index.html','html','<main class="profile-card">\n  <!-- Apresente uma pessoa aqui -->\n</main>',1),
  (5,2,'style.css','css','* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui; background: #e2e8f0; }\n\n/* Transforme o perfil em um cartão */',2),
  (6,2,'script.js','javascript','// Este projeto é focado em HTML e CSS.',3),
  (7,3,'index.html','html','<header>\n  <!-- Marca e navegação -->\n</header>\n<main>\n  <!-- Destaque do produto -->\n</main>',1),
  (8,3,'style.css','css','* { box-sizing: border-box; }\nbody { margin: 0; font-family: system-ui; background: #e2e8f0; }\n\n/* Estilize a landing page */',2),
  (9,3,'script.js','javascript','// Este projeto é focado em HTML e CSS.',3);
--> statement-breakpoint
UPDATE `user_project_progress` SET `state`='locked' WHERE `state`<>'completed';
--> statement-breakpoint
PRAGMA optimize;
