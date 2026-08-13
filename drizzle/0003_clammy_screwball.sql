CREATE TABLE `sql_mission_configs` (
	`mission_id` integer PRIMARY KEY NOT NULL,
	`dialect` text DEFAULT 'sqlite' NOT NULL,
	`runtime_version` text DEFAULT 'sqlite-wasm-1' NOT NULL,
	`schema_sql` text NOT NULL,
	`seed_sql` text NOT NULL,
	`starter_sql` text NOT NULL,
	`expected_result_json` text NOT NULL,
	`table_schema_json` text NOT NULL,
	`table_preview_json` text NOT NULL,
	`max_rows` integer DEFAULT 100 NOT NULL,
	`timeout_ms` integer DEFAULT 250 NOT NULL,
	`max_statements` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`mission_id`) REFERENCES `missions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `submissions` ADD `result_rows` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO `technologies` (`id`,`slug`,`name`) VALUES (2,'sql','SQL');
--> statement-breakpoint
INSERT OR IGNORE INTO `learning_paths` (`id`,`technology_id`,`slug`,`name`,`description`,`version`,`status`) VALUES
  (2,2,'sql-fundamentals-sqlite','SQL Fundamentals · SQLite','Aprenda consultas de leitura em um banco SQLite descartável.',1,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `skills` (`id`,`learning_path_id`,`slug`,`name`,`description`,`xp_reward`,`sort_order`,`status`) VALUES
  (6,2,'select','SELECT','Escolher colunas e consultar uma tabela.',100,1,'published'),
  (7,2,'where','WHERE','Filtrar linhas por uma condição.',100,2,'published'),
  (8,2,'order-by','ORDER BY','Ordenar o resultado da consulta.',110,3,'published'),
  (9,2,'between','BETWEEN','Filtrar valores dentro de uma faixa.',110,4,'published'),
  (10,2,'like','LIKE','Localizar textos por padrão.',120,5,'published'),
  (11,2,'in','IN','Selecionar valores de uma lista.',120,6,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `lessons` (`id`,`skill_id`,`slug`,`title`,`body_json`,`sort_order`,`status`) VALUES
  (6,6,'sql-select-intro','Lendo uma tabela','{"summary":"SELECT define quais dados uma consulta devolve."}',1,'published'),
  (7,7,'sql-where-intro','Filtrando linhas','{"summary":"WHERE mantém apenas as linhas que atendem a uma condição."}',1,'published'),
  (8,8,'sql-order-by-intro','Ordenando resultados','{"summary":"ORDER BY controla a ordem das linhas retornadas."}',1,'published'),
  (9,9,'sql-between-intro','Consultando faixas','{"summary":"BETWEEN verifica valores entre dois limites inclusivos."}',1,'published'),
  (10,10,'sql-like-intro','Buscando padrões','{"summary":"LIKE encontra textos usando os curingas % e _."}',1,'published'),
  (11,11,'sql-in-intro','Filtrando listas','{"summary":"IN compara um valor com uma lista de opções."}',1,'published');
--> statement-breakpoint
INSERT OR IGNORE INTO `missions` (`id`,`skill_id`,`slug`,`title`,`briefing`,`objective`,`starter_code`,`function_name`,`parameters_json`,`runtime`,`runner_version`,`difficulty`,`version`,`status`,`xp_reward`,`sort_order`,`next_mission_slug`) VALUES
  (6,6,'listar-produtos','O catálogo da oficina','A oficina precisa visualizar o catálogo completo antes de iniciar o inventário.','Liste todas as colunas e todos os produtos da tabela PRODUTOS.','SELECT *\nFROM PRODUTOS;','','[]','sqlite','sqlite-wasm-1','beginner',1,'published',100,1,'produtos-ativos'),
  (7,7,'produtos-ativos','Somente itens ativos','O balcão deve mostrar apenas produtos disponíveis para venda.','Liste todas as colunas dos produtos cujo ATIVO seja S.','SELECT *\nFROM PRODUTOS\nWHERE ATIVO = ''S'';','','[]','sqlite','sqlite-wasm-1','beginner',1,'published',100,2,'ordenar-produtos-por-valor'),
  (8,8,'ordenar-produtos-por-valor','A vitrine por preço','O cliente quer comparar os produtos do menor para o maior valor.','Liste todos os produtos ordenados por VALOR crescente.','SELECT *\nFROM PRODUTOS\nORDER BY VALOR ASC;','','[]','sqlite','sqlite-wasm-1','easy',1,'published',110,3,'produtos-na-faixa'),
  (9,9,'produtos-na-faixa','A faixa de preço','A oficina precisa encontrar produtos entre vinte e cinquenta reais.','Liste todos os produtos com VALOR entre 20 e 50, inclusive.','SELECT *\nFROM PRODUTOS\nWHERE VALOR BETWEEN 20 AND 50;','','[]','sqlite','sqlite-wasm-1','easy',1,'published',110,4,'buscar-filtro'),
  (10,10,'buscar-filtro','Busca por descrição','O atendente lembra que o produto procurado possui Filtro no nome.','Liste os produtos cuja DESCRICAO contenha a palavra Filtro.','SELECT *\nFROM PRODUTOS\nWHERE DESCRICAO LIKE ''%Filtro%'';','','[]','sqlite','sqlite-wasm-1','easy',1,'published',120,5,'produtos-selecionados'),
  (11,11,'produtos-selecionados','A lista de separação','A equipe solicitou apenas os produtos identificados por 1, 4 e 6.','Liste os produtos cujo ID esteja na lista 1, 4 e 6.','SELECT *\nFROM PRODUTOS\nWHERE ID IN (1, 4, 6);','','[]','sqlite','sqlite-wasm-1','easy',1,'published',120,6,NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO `mission_prerequisites` (`mission_id`,`prerequisite_mission_id`) VALUES (7,6),(8,7),(9,8),(10,9),(11,10);
--> statement-breakpoint
INSERT OR IGNORE INTO `sql_mission_configs`
  (`mission_id`,`dialect`,`runtime_version`,`schema_sql`,`seed_sql`,`starter_sql`,`expected_result_json`,`table_schema_json`,`table_preview_json`,`max_rows`,`timeout_ms`,`max_statements`) VALUES
  (6,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS;','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]],"orderMatters":false}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1),
  (7,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS\nWHERE ATIVO = ''S'';','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[6,"Vela de ignição",35,"S"]],"orderMatters":false}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1),
  (8,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS\nORDER BY VALOR ASC;','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[6,"Vela de ignição",35,"S"],[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[5,"Correia dentada",120,"N"]],"orderMatters":true}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1),
  (9,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS\nWHERE VALOR BETWEEN 20 AND 50;','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[4,"Filtro de óleo",22.5,"S"],[6,"Vela de ignição",35,"S"]],"orderMatters":false}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1),
  (10,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS\nWHERE DESCRICAO LIKE ''%Filtro%'';','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[4,"Filtro de óleo",22.5,"S"]],"orderMatters":false}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1),
  (11,'sqlite','sqlite-wasm-1','CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, DESCRICAO TEXT NOT NULL, VALOR REAL NOT NULL, ATIVO TEXT NOT NULL);','INSERT INTO PRODUTOS VALUES (1,''Óleo 5W30'',45.0,''S''),(2,''Pastilha de freio'',89.9,''N''),(3,''Fluido de freio'',18.5,''S''),(4,''Filtro de óleo'',22.5,''S''),(5,''Correia dentada'',120.0,''N''),(6,''Vela de ignição'',35.0,''S'');','SELECT *\nFROM PRODUTOS\nWHERE ID IN (1, 4, 6);','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[4,"Filtro de óleo",22.5,"S"],[6,"Vela de ignição",35,"S"]],"orderMatters":false}','{"tables":[{"name":"PRODUTOS","columns":[{"name":"ID","type":"INTEGER","primaryKey":true},{"name":"DESCRICAO","type":"TEXT"},{"name":"VALOR","type":"REAL"},{"name":"ATIVO","type":"TEXT"}]}]}','{"columns":["ID","DESCRICAO","VALOR","ATIVO"],"rows":[[1,"Óleo 5W30",45,"S"],[2,"Pastilha de freio",89.9,"N"],[3,"Fluido de freio",18.5,"S"],[4,"Filtro de óleo",22.5,"S"],[5,"Correia dentada",120,"N"],[6,"Vela de ignição",35,"S"]]}',100,250,1);
--> statement-breakpoint
INSERT OR IGNORE INTO `user_learning_paths` (`user_id`,`learning_path_id`) SELECT `user_id`,2 FROM `profiles`;
--> statement-breakpoint
INSERT OR IGNORE INTO `user_missions` (`user_id`,`mission_id`,`state`) SELECT `user_id`,6,'available' FROM `profiles`;
--> statement-breakpoint
PRAGMA optimize;
