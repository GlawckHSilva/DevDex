CREATE TABLE IF NOT EXISTS `user_onboarding` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `profiles`(`user_id`) ON DELETE CASCADE,
  `stage` text NOT NULL DEFAULT 'intro',
  `selected_path` text,
  `archetype` text,
  `completed_at` text,
  `rewarded_xp` integer NOT NULL DEFAULT 0,
  `updated_at` text NOT NULL DEFAULT CURRENT_TIMESTAMP
);
