export const missionState = `CASE
  WHEN um.state='completed' THEN 'completed'
  WHEN EXISTS (SELECT 1 FROM mission_prerequisites mp
    LEFT JOIN user_missions required ON required.mission_id=mp.prerequisite_mission_id AND required.user_id=?
    WHERE mp.mission_id=m.id AND COALESCE(required.state,'locked')<>'completed') THEN 'locked'
  WHEN EXISTS (SELECT 1 FROM mission_lesson_prerequisites mlp
    LEFT JOIN user_lessons required_lesson ON required_lesson.lesson_id=mlp.lesson_id AND required_lesson.user_id=?
    WHERE mlp.mission_id=m.id AND required_lesson.lesson_id IS NULL) THEN 'locked'
  WHEN um.state='in_progress' THEN 'in_progress'
  ELSE 'available' END`;
