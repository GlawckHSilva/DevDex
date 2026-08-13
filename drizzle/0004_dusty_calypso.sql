CREATE TABLE `web_mission_configs` (
	`mission_id` integer PRIMARY KEY NOT NULL,
	`document_type` text NOT NULL,
	`runtime_version` text DEFAULT 'web-parser-1' NOT NULL,
	`starter_code` text NOT NULL,
	`preview_html` text DEFAULT '' NOT NULL,
	`preview_css` text DEFAULT '' NOT NULL,
	`validator_json` text NOT NULL,
	`max_length` integer DEFAULT 8000 NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT OR IGNORE INTO `technologies` (`id`,`slug`,`name`) VALUES (3,'html','HTML'),(4,'css','CSS');
--> statement-breakpoint
INSERT OR IGNORE INTO `learning_paths` (`id`,`technology_id`,`slug`,`name`,`description`,`version`,`status`) VALUES
  (3,3,'html-fundamentals','HTML Fundamentals','Construa interfaces semânticas com preview visual isolado.',1,'published'),
  (4,4,'css-fundamentals','CSS Fundamentals','Estilize componentes e layouts em um preview visual isolado.',1,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `skills` (`id`,`learning_path_id`,`slug`,`name`,`description`,`xp_reward`,`sort_order`,`status`) VALUES
  (12,3,'html-content','Conteúdo semântico','Organizar títulos e parágrafos.',100,1,'published'),
  (13,3,'html-navigation','Navegação','Criar links internos acessíveis.',100,2,'published'),
  (14,3,'html-lists','Listas','Estruturar coleções de itens.',110,3,'published'),
  (15,3,'html-forms','Formulários','Relacionar campos, rótulos e ações.',120,4,'published'),
  (16,4,'css-colors','Cores','Aplicar cores a componentes.',100,1,'published'),
  (17,4,'css-spacing','Espaçamento','Controlar margens e preenchimentos.',100,2,'published'),
  (18,4,'css-borders','Bordas','Definir contornos e cantos.',110,3,'published'),
  (19,4,'css-flexbox','Flexbox','Distribuir componentes em um layout flexível.',120,4,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `lessons` (`id`,`skill_id`,`slug`,`title`,`body_json`,`sort_order`,`status`) VALUES
  (12,12,'html-conteudo-intro','Conteúdo com significado','{"summary":"Títulos e parágrafos organizam a leitura."}',1,'published'),
  (13,13,'html-links-intro','Navegação interna','{"summary":"Âncoras conectam o usuário às seções da página."}',1,'published'),
  (14,14,'html-listas-intro','Coleções semânticas','{"summary":"Listas representam grupos de itens relacionados."}',1,'published'),
  (15,15,'html-formularios-intro','Campos acessíveis','{"summary":"Rótulos identificam os campos de um formulário."}',1,'published'),
  (16,16,'css-cores-intro','Contraste visual','{"summary":"Cores de fundo e texto definem contraste."}',1,'published'),
  (17,17,'css-espacamento-intro','Espaço no componente','{"summary":"Padding cria espaço interno e margin cria espaço externo."}',1,'published'),
  (18,18,'css-bordas-intro','Acabamento do cartão','{"summary":"Bordas e raio ajudam a delimitar componentes."}',1,'published'),
  (19,19,'css-flexbox-intro','Layout flexível','{"summary":"Flexbox distribui elementos em uma dimensão."}',1,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `missions` (`id`,`skill_id`,`slug`,`title`,`briefing`,`objective`,`starter_code`,`function_name`,`parameters_json`,`runtime`,`runner_version`,`difficulty`,`version`,`status`,`xp_reward`,`sort_order`,`next_mission_slug`) VALUES
  (12,12,'pagina-da-oficina','A página da oficina','A oficina precisa de uma apresentação clara para receber seus clientes.','Crie um h1 com Oficina DevDex e um parágrafo que mencione código.','','','[]','html','web-parser-1','beginner',1,'published',100,1,'navegacao-da-oficina'),
  (13,13,'navegacao-da-oficina','Atalho para serviços','O visitante deve chegar rapidamente à seção de serviços.','Crie um nav com um link Serviços para #servicos e uma section com esse id.','','','[]','html','web-parser-1','beginner',1,'published',100,2,'lista-de-servicos'),
  (14,14,'lista-de-servicos','Catálogo organizado','A oficina quer apresentar os principais serviços em uma lista.','Crie uma lista não ordenada com pelo menos três itens.','','','[]','html','web-parser-1','easy',1,'published',110,3,'formulario-da-oficina'),
  (15,15,'formulario-da-oficina','Contato do cliente','A equipe precisa receber o e-mail do cliente com um formulário acessível.','Crie form, label para email, input email e botão de envio.','','','[]','html','web-parser-1','easy',1,'published',120,4,NULL),
  (16,16,'cores-do-cartao','Cores do cartão','O cartão de serviço precisa de contraste para se destacar.','Defina #0f172a como background-color e #f8fafc como color de .card.','','','[]','css','web-parser-1','beginner',1,'published',100,1,'espaco-do-cartao'),
  (17,17,'espaco-do-cartao','Respiro do cartão','O conteúdo do cartão está apertado e próximo dos demais elementos.','Defina padding de 24px e margin de 16px em .card.','','','[]','css','web-parser-1','beginner',1,'published',100,2,'acabamento-do-cartao'),
  (18,18,'acabamento-do-cartao','Acabamento do cartão','O componente precisa de contorno e cantos suaves.','Defina border 1px solid #334155 e border-radius de 12px em .card.','','','[]','css','web-parser-1','easy',1,'published',110,3,'catalogo-flexivel'),
  (19,19,'catalogo-flexivel','Catálogo flexível','Os cartões precisam ocupar a mesma linha e quebrar quando necessário.','Defina display flex, gap 16px e flex-wrap wrap em .catalogo.','','','[]','css','web-parser-1','easy',1,'published',120,4,NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO `mission_prerequisites` (`mission_id`,`prerequisite_mission_id`) VALUES
  (13,12),(14,13),(15,14),(17,16),(18,17),(19,18);
--> statement-breakpoint
INSERT OR IGNORE INTO `web_mission_configs` (`mission_id`,`document_type`,`runtime_version`,`starter_code`,`preview_html`,`preview_css`,`validator_json`,`max_length`) VALUES
  (12,'html','web-parser-1','<main>\n  <!-- Adicione o título e a apresentação -->\n</main>','','body{font-family:system-ui;padding:32px;color:#0f172a}main{max-width:680px;margin:auto}h1{color:#6d28d9}','[{"type":"element","tag":"h1","textIncludes":"Oficina DevDex"},{"type":"element","tag":"p","textIncludes":"código"}]',8000),
  (13,'html','web-parser-1','<nav>\n  <!-- Adicione o link -->\n</nav>\n<section>\n  <h1>Serviços</h1>\n</section>','','body{font-family:system-ui;padding:32px}nav{margin-bottom:32px}a{color:#6d28d9}section{padding:24px;background:#f1f5f9}','[{"type":"element","tag":"nav"},{"type":"element","tag":"a","textIncludes":"Serviços","attributes":{"href":"#servicos"}},{"type":"element","tag":"section","attributes":{"id":"servicos"}}]',8000),
  (14,'html','web-parser-1','<h1>Serviços</h1>\n<!-- Crie a lista aqui -->','','body{font-family:system-ui;padding:32px;color:#0f172a}li{margin:10px 0}','[{"type":"element","tag":"ul"},{"type":"element","tag":"li","min":3}]',8000),
  (15,'html','web-parser-1','<form>\n  <!-- Adicione rótulo, campo e botão -->\n</form>','','body{font-family:system-ui;padding:32px}form{display:grid;gap:12px;max-width:360px}input,button{padding:10px}button{background:#6d28d9;color:white;border:0}','[{"type":"element","tag":"form"},{"type":"element","tag":"label","attributes":{"for":"email"}},{"type":"element","tag":"input","attributes":{"id":"email","type":"email"}},{"type":"element","tag":"button","attributes":{"type":"submit"}}]',8000),
  (16,'css','web-parser-1','body {\n  font-family: system-ui;\n  padding: 32px;\n}\n\n.card {\n  /* Adicione as cores */\n}','<main><h1>Serviços</h1><article class="card"><h2>Revisão completa</h2><p>Diagnóstico e manutenção preventiva.</p></article>','','[{"type":"style","selector":".card","declarations":{"background-color":"#0f172a","color":"#f8fafc"}}]',8000),
  (17,'css','web-parser-1','body { font-family: system-ui; }\n.card {\n  background: #e2e8f0;\n  /* Adicione os espaços */\n}','<main><h1>Serviços</h1><article class="card"><h2>Troca de óleo</h2><p>Proteção para o motor.</p></article>','','[{"type":"style","selector":".card","declarations":{"padding":"24px","margin":"16px"}}]',8000),
  (18,'css','web-parser-1','body { font-family: system-ui; padding: 32px; }\n.card {\n  padding: 24px;\n  /* Adicione o acabamento */\n}','<main><article class="card"><h2>Alinhamento</h2><p>Direção estável e segura.</p></article>','','[{"type":"style","selector":".card","declarations":{"border":"1px solid #334155","border-radius":"12px"}}]',8000),
  (19,'css','web-parser-1','body { font-family: system-ui; padding: 32px; }\n.catalogo {\n  /* Crie o layout flexível */\n}\n.card { padding: 18px; background: #e2e8f0; }','','','[{"type":"style","selector":".catalogo","declarations":{"display":"flex","gap":"16px","flex-wrap":"wrap"}}]',8000);
--> statement-breakpoint
UPDATE `web_mission_configs` SET `preview_html`='<main><h1>Serviços</h1><section class="catalogo"><article class="card"><h2>Revisão</h2><p>Manutenção preventiva.</p></article><article class="card"><h2>Freios</h2><p>Segurança em cada parada.</p></article></section></main>' WHERE `mission_id`=19;
--> statement-breakpoint
INSERT OR IGNORE INTO `user_learning_paths` (`user_id`,`learning_path_id`) SELECT `user_id`,3 FROM `profiles`;
--> statement-breakpoint
INSERT OR IGNORE INTO `user_learning_paths` (`user_id`,`learning_path_id`) SELECT `user_id`,4 FROM `profiles`;
--> statement-breakpoint
INSERT OR IGNORE INTO `user_missions` (`user_id`,`mission_id`,`state`) SELECT `user_id`,12,'available' FROM `profiles`;
--> statement-breakpoint
INSERT OR IGNORE INTO `user_missions` (`user_id`,`mission_id`,`state`) SELECT `user_id`,16,'available' FROM `profiles`;
--> statement-breakpoint
PRAGMA optimize;
