export const missionState = `CASE
  WHEN um.state='completed' THEN 'completed'
  WHEN EXISTS (SELECT 1 FROM mission_prerequisites mp
    LEFT JOIN user_missions required ON required.mission_id=mp.prerequisite_mission_id AND required.user_id=?
    WHERE mp.mission_id=m.id AND COALESCE(required.state,'locked')<>'completed') THEN 'locked'
  WHEN um.state='in_progress' THEN 'in_progress'
  ELSE 'available' END`;
