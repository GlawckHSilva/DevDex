CREATE TABLE `user_content_reviews` (
  `user_id` text NOT NULL,
  `content_id` integer NOT NULL,
  `correct_answers` integer DEFAULT 0 NOT NULL,
  `incorrect_answers` integer DEFAULT 0 NOT NULL,
  `interval_days` integer DEFAULT 1 NOT NULL,
  `next_review_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `last_reviewed_at` text,
  PRIMARY KEY (`user_id`,`content_id`),
  FOREIGN KEY (`user_id`) REFERENCES `profiles`(`user_id`) ON DELETE cascade,
  FOREIGN KEY (`content_id`) REFERENCES `educational_contents`(`id`) ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_user_content_reviews_due` ON `user_content_reviews` (`user_id`,`next_review_at`);
--> statement-breakpoint
UPDATE educational_contents SET
  when_to_use='Consulte antes da batalha de ' || lower(title) || ', durante a prática ou ao revisar uma dificuldade.',
  common_mistakes_json=json_array(
    'Ignorar ' || lower(COALESCE((SELECT json_extract(l.body_json,'$.keyPoints[0]') FROM lessons l WHERE l.id=educational_contents.lesson_id),'o conceito central')) || '.',
    'Copiar o exemplo sem adaptar ao objetivo e sem validar o resultado.'
  ),
  quiz_json=(SELECT json_object(
    'question','Qual ponto é essencial em “' || educational_contents.title || '”?',
    'options',json_array(
      COALESCE(json_extract(l.body_json,'$.keyPoints[0]'),'Entender o objetivo antes de implementar.'),
      'Ignorar o contexto e aplicar qualquer solução.',
      'Pular a validação e considerar o trabalho concluído.'
    ),
    'correctIndex',0,
    'explanation','A resposta vem dos pontos essenciais apresentados no material de estudo.'
  ) FROM lessons l WHERE l.id=educational_contents.lesson_id);
--> statement-breakpoint
INSERT OR IGNORE INTO content_prerequisites (content_id,prerequisite_content_id)
SELECT current.id,previous.id FROM educational_contents current
JOIN educational_contents previous ON previous.learning_path_id=current.learning_path_id
  AND previous.sort_order=(SELECT MAX(candidate.sort_order) FROM educational_contents candidate
    WHERE candidate.learning_path_id=current.learning_path_id AND candidate.sort_order<current.sort_order)
WHERE current.status='published' AND previous.status='published';
--> statement-breakpoint
UPDATE educational_contents AS current SET comparisons_json=json_array(
  (SELECT previous.title FROM educational_contents previous
    WHERE previous.learning_path_id=current.learning_path_id AND previous.sort_order<current.sort_order AND previous.status='published'
    ORDER BY previous.sort_order DESC LIMIT 1),
  (SELECT following.title FROM educational_contents following
    WHERE following.learning_path_id=current.learning_path_id AND following.sort_order>current.sort_order AND following.status='published'
    ORDER BY following.sort_order LIMIT 1)
);
--> statement-breakpoint
PRAGMA optimize;
