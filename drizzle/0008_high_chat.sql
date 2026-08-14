CREATE TABLE `campaign_recommendations` (
	`campaign_id` integer NOT NULL,
	`recommended_technology_id` integer NOT NULL,
	`label` text NOT NULL,
	PRIMARY KEY(`campaign_id`, `recommended_technology_id`),
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recommended_technology_id`) REFERENCES `technologies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `campaign_zones` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`story_intro` text NOT NULL,
	`story_outro` text DEFAULT '' NOT NULL,
	`sort_order` integer NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`background_asset` text,
	`boss_mission_id` integer,
	`boss_project_id` integer,
	FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`boss_mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`boss_project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_campaign_zones_campaign_slug` ON `campaign_zones` (`campaign_id`,`slug`);--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`technology_id` integer NOT NULL,
	`learning_path_id` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text NOT NULL,
	`story_intro` text NOT NULL,
	`theme` text NOT NULL,
	`status` text DEFAULT 'published' NOT NULL,
	`sort_order` integer NOT NULL,
	`visual_config` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`technology_id`) REFERENCES `technologies`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learning_path_id`) REFERENCES `learning_paths`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campaigns_slug_unique` ON `campaigns` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_campaigns_learning_path` ON `campaigns` (`learning_path_id`);--> statement-breakpoint
DROP INDEX `idx_battle_configs_zone_order`;--> statement-breakpoint
ALTER TABLE `mission_battle_configs` ADD `zone_id` integer REFERENCES campaign_zones(id);--> statement-breakpoint
ALTER TABLE `mission_battle_configs` ADD `enemy_intro` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `mission_battle_configs` ADD `battle_dialogue` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `mission_battle_configs` ADD `boss_intro` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `mission_battle_configs` ADD `boss_victory` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_battle_configs_zone_order` ON `mission_battle_configs` (`zone_id`,`sort_order`);
--> statement-breakpoint
INSERT INTO `campaigns` (`id`,`technology_id`,`learning_path_id`,`slug`,`title`,`subtitle`,`story_intro`,`theme`,`status`,`sort_order`,`visual_config`) VALUES
  (1,3,3,'cronicas-da-estrutura','Crônicas da Estrutura','Reconstrua o mundo digital bloco por bloco.','O mundo digital perdeu sua estrutura: textos desapareceram, caminhos se romperam e formulários foram corrompidos. Restaure cada fundação dominando HTML.','structure-ruins','published',1,'{"accent":"#e89b4f","symbol":"<>"}'),
  (2,4,4,'reino-dos-estilos','Reino dos Estilos','Devolva cor, ordem e ritmo ao mundo.','As estruturas sobreviveram, mas tudo perdeu cor, alinhamento e identidade. Use CSS para reorganizar o reino e trazer sua aparência de volta.','style-realm','published',2,'{"accent":"#58a6ff","symbol":"#"}'),
  (3,1,1,'cidade-da-logica','Cidade da Lógica','Reative os sistemas que esqueceram como pensar.','A cidade perdeu a capacidade de guardar valores, tomar decisões e repetir tarefas. Restaure sua lógica vencendo os bugs que controlam cada distrito.','logic-city','published',3,'{"accent":"#f4d35e","symbol":"JS"}'),
  (4,2,2,'minas-dos-dados','Minas dos Dados','Recupere os registros soterrados no grande arquivo.','Um grande arquivo foi fragmentado e soterrado. Encontre, filtre e organize os registros perdidos para devolver conhecimento ao universo DevDex.','data-mines','published',4,'{"accent":"#4dd8b8","symbol":"DB"}');
--> statement-breakpoint
INSERT INTO `campaign_zones` (`id`,`campaign_id`,`slug`,`title`,`story_intro`,`story_outro`,`sort_order`,`status`,`boss_mission_id`,`boss_project_id`) VALUES
  (1,1,'ruinas-da-estrutura','Ruínas da Estrutura','As primeiras páginas estão desmoronando. Recupere conteúdo, navegação, listas e formulários.','A estrutura fundamental voltou a sustentar o mundo.',1,'published',15,NULL),
  (2,2,'distrito-sem-cor','Distrito sem Cor','O distrito ainda existe, porém contraste, espaço e organização desapareceram.','O distrito recuperou sua identidade visual.',1,'published',19,NULL),
  (3,3,'bosque-dos-fundamentos','Bosque dos Fundamentos','Cinco criaturas controlam os fundamentos da lógica. Derrote-as para reativar o primeiro distrito.','Os sistemas essenciais da Cidade da Lógica voltaram a funcionar.',1,'published',5,1),
  (4,4,'arquivo-perdido','Arquivo Perdido','Os primeiros registros estão soterrados em tabelas fragmentadas. Recupere-os com consultas precisas.','O primeiro arquivo foi reconstruído e catalogado.',1,'published',11,NULL);
--> statement-breakpoint
UPDATE `mission_battle_configs` SET `zone_id`=3,
  `enemy_intro`='Uma criatura corrompeu um fundamento da lógica.',
  `battle_dialogue`='Restaure o comportamento correto com código executável.',
  `boss_intro`=CASE WHEN `mission_id`=5 THEN 'A Hidra protege a saída do bosque e combina tudo que você aprendeu.' ELSE '' END,
  `boss_victory`=CASE WHEN `mission_id`=5 THEN 'O bosque foi libertado e o primeiro distrito voltou a responder.' ELSE '' END
  WHERE `mission_id` BETWEEN 1 AND 5;
--> statement-breakpoint
INSERT INTO `mission_battle_configs` (`mission_id`,`zone_id`,`zone_slug`,`enemy_name`,`enemy_type`,`enemy_level`,`hint`,`enemy_intro`,`battle_dialogue`,`boss_intro`,`boss_victory`,`sort_order`) VALUES
  (12,1,'ruinas-da-estrutura','Espectro do Esqueleto','enemy',1,'Use um h1 para o título principal e um parágrafo para apresentar a oficina.','O espectro apaga títulos e parágrafos das páginas.','Reconstrua a hierarquia de conteúdo para enfraquecê-lo.','','',1),
  (13,1,'ruinas-da-estrutura','Aranha das Âncoras','enemy',2,'Conecte o link ao id da seção usando href com #.','Teias quebradas impedem qualquer navegação.','Reconecte os caminhos com âncoras semânticas.','','',2),
  (14,1,'ruinas-da-estrutura','Colecionador de Listas','elite',3,'Use uma lista não ordenada com três itens relacionados.','A elite aprisionou coleções inteiras em blocos sem significado.','Organize os itens em uma estrutura reconhecível.','','',3),
  (15,1,'ruinas-da-estrutura','Guardião dos Formulários','boss',4,'Associe label e input pelo atributo for/id e inclua um botão de envio.','O guardião bloqueia toda comunicação com os habitantes.','Construa um formulário acessível para abrir os portões.','O boss combina campos, rótulos e ações em uma única estrutura.','Os formulários voltaram a conectar pessoas e sistemas.',4),
  (16,2,'distrito-sem-cor','Parasita do Contraste','enemy',1,'Aplique as cores pedidas na regra .card.','A criatura drenou toda distinção entre texto e superfície.','Recupere o contraste do cartão.','','',1),
  (17,2,'distrito-sem-cor','Devorador de Espaço','enemy',2,'Padding cria espaço interno; margin separa o cartão dos vizinhos.','Elementos se comprimem enquanto o devorador avança.','Restaure o respiro visual correto.','','',2),
  (18,2,'distrito-sem-cor','Armeiro das Bordas','elite',3,'Combine border e border-radius na mesma regra.','A elite removeu os limites dos componentes.','Forje novamente contornos e acabamento.','','',3),
  (19,2,'distrito-sem-cor','Colosso Flex','boss',4,'Use display flex, gap e flex-wrap na coleção.','O colosso mantém todos os componentes empilhados e imóveis.','Reorganize o campo com um layout flexível.','O boss exige distribuição, espaçamento e adaptação juntos.','O distrito recuperou ordem, ritmo e movimento.',4),
  (6,4,'arquivo-perdido','Mineiro do SELECT','enemy',1,'Selecione as colunas necessárias a partir de PRODUTOS.','O mineiro escondeu o catálogo no primeiro veio de dados.','Recupere todas as linhas com uma consulta segura.','','',1),
  (7,4,'arquivo-perdido','Sentinela WHERE','enemy',2,'Use WHERE para manter apenas produtos ativos.','A sentinela mistura registros válidos e corrompidos.','Filtre somente as linhas que atendem à condição.','','',2),
  (8,4,'arquivo-perdido','Escrivão ORDER','enemy',3,'Ordene VALOR de forma crescente com ORDER BY.','Os registros foram embaralhados pelo escrivão.','Reestabeleça uma ordem útil para leitura.','','',3),
  (9,4,'arquivo-perdido','Guardião BETWEEN','enemy',4,'BETWEEN inclui os dois limites da faixa.','O guardião lacrou todos os valores entre dois marcos.','Consulte a faixa correta sem perder os limites.','','',4),
  (10,4,'arquivo-perdido','Mímico LIKE','elite',5,'Use % antes e depois de Filtro para buscar o trecho no texto.','A elite muda nomes para esconder registros importantes.','Encontre o padrão mesmo dentro de descrições maiores.','','',5),
  (11,4,'arquivo-perdido','Oráculo IN','boss',6,'Use IN com a lista de identificadores solicitada.','O oráculo fragmentou a lista final em vários pontos do arquivo.','Reúna somente os registros indicados.','O boss exige selecionar uma lista precisa sem expor o restante do arquivo.','O Arquivo Perdido foi recuperado e catalogado.',6);
--> statement-breakpoint
PRAGMA optimize;
