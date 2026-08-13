insert into public.technologies (id, slug, name, description, sort_order, status) values
  ('10000000-0000-4000-8000-000000000001','html','HTML','Estrutura semântica da web.',1,'published'),
  ('10000000-0000-4000-8000-000000000002','css','CSS','Estilos, layout e responsividade.',2,'published'),
  ('10000000-0000-4000-8000-000000000003','javascript','JavaScript','Lógica e programação para a web.',3,'published'),
  ('10000000-0000-4000-8000-000000000004','sql','SQL','Fundamentos de bancos relacionais.',4,'published');

insert into public.curriculum_versions (id, technology_id, version, status) values
  ('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','1.0.0','published'),
  ('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','1.0.0','published'),
  ('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','1.0.0','published'),
  ('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','1.0.0','published');

insert into public.learning_paths (id, curriculum_version_id, slug, name, description, sort_order, status) values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','html-fundamentals','HTML Fundamentals','Estrutura, texto, links e formulários.',1,'published'),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','css-fundamentals','CSS Fundamentals','Seletores, cores, espaçamento e Flexbox.',2,'published'),
  ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000003','javascript-fundamentals','JavaScript Fundamentals','Variáveis, condições, loops, funções e arrays.',3,'published'),
  ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000004','sql-fundamentals','SQL Fundamentals','SELECT, WHERE, ORDER BY, BETWEEN, LIKE e IN.',4,'published');

insert into public.skills (learning_path_id, slug, name, description, sort_order, status) values
  ('30000000-0000-4000-8000-000000000001','document-structure','Estrutura do documento','Elementos essenciais e semântica básica.',1,'draft'),
  ('30000000-0000-4000-8000-000000000001','forms','Formulários','Campos, rótulos e envio acessível.',2,'draft'),
  ('30000000-0000-4000-8000-000000000002','selectors','Seletores','Selecionar elementos com precisão.',1,'draft'),
  ('30000000-0000-4000-8000-000000000002','flexbox','Flexbox','Criar layouts flexíveis.',2,'draft'),
  ('30000000-0000-4000-8000-000000000003','variables','Variáveis','Declarar e manipular valores.',1,'draft'),
  ('30000000-0000-4000-8000-000000000003','functions','Funções','Encapsular comportamento reutilizável.',2,'draft'),
  ('30000000-0000-4000-8000-000000000003','arrays','Arrays','Trabalhar com coleções ordenadas.',3,'draft'),
  ('30000000-0000-4000-8000-000000000004','select','SELECT','Consultar dados de tabelas.',1,'draft'),
  ('30000000-0000-4000-8000-000000000004','filters','Filtros','Restringir resultados com segurança.',2,'draft');
