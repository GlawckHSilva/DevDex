ALTER TABLE `campaigns` ADD `lore_title` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_subtitle` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_sender` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_intro_text` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_short_description` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_signature` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `campaigns` ADD `lore_transmission_id` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `user_learning_paths` ADD `lore_seen_at` text;
--> statement-breakpoint
UPDATE `campaigns` SET
  `lore_title`='Crônicas da Estrutura',
  `lore_subtitle`='PROTOCOLO · RECONSTRUÇÃO SEMÂNTICA',
  `lore_sender`='Arquivista Zero',
  `lore_intro_text`='O mundo digital perdeu sua estrutura. Textos desapareceram, caminhos foram rompidos e formulários caíram sob a corrupção. Domine HTML, restaure cada fundação e derrote os bugs antes que o vazio apague o que restou.',
  `lore_short_description`='Restaure as fundações do mundo digital.',
  `lore_signature`='— Arquivista Zero',
  `lore_transmission_id`='HTML-STR-001'
WHERE `id`=1;
--> statement-breakpoint
UPDATE `campaigns` SET
  `lore_title`='Reino dos Estilos',
  `lore_subtitle`='PROTOCOLO · RESTAURAÇÃO VISUAL',
  `lore_sender`='Curadora Prism',
  `lore_intro_text`='As estruturas sobreviveram, mas o reino perdeu cor, alinhamento e identidade. Use CSS para devolver contraste, ritmo e forma às interfaces antes que a desordem visual domine todos os distritos.',
  `lore_short_description`='Devolva forma, cor e ritmo ao reino.',
  `lore_signature`='— Curadora Prism',
  `lore_transmission_id`='CSS-STYLE-002'
WHERE `id`=2;
--> statement-breakpoint
UPDATE `campaigns` SET
  `lore_title`='Cidade da Lógica',
  `lore_subtitle`='PROTOCOLO · REATIVAÇÃO DOS SISTEMAS',
  `lore_sender`='Operador Lambda',
  `lore_intro_text`='A cidade esqueceu como guardar valores, tomar decisões e repetir tarefas. Reative seus sistemas com JavaScript e elimine os bugs que interromperam o fluxo lógico de cada distrito.',
  `lore_short_description`='Reative a lógica que mantém a cidade viva.',
  `lore_signature`='— Operador Lambda',
  `lore_transmission_id`='JS-LOGIC-003'
WHERE `id`=3;
--> statement-breakpoint
UPDATE `campaigns` SET
  `lore_title`='Minas dos Dados',
  `lore_subtitle`='PROTOCOLO · RECUPERAÇÃO DO ARQUIVO',
  `lore_sender`='Guardião do Arquivo',
  `lore_intro_text`='Registros essenciais foram fragmentados e soterrados nas minas. Consulte, filtre e relacione os dados com SQL para reconstruir o grande arquivo antes que sua memória desapareça.',
  `lore_short_description`='Recupere os registros soterrados nas minas.',
  `lore_signature`='— Guardião do Arquivo',
  `lore_transmission_id`='SQL-DATA-004'
WHERE `id`=4;
--> statement-breakpoint
UPDATE `mission_battle_configs` SET `enemy_name`='Espectro do Esqueleto' WHERE `mission_id`=12;
--> statement-breakpoint
PRAGMA optimize;
