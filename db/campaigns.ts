import { getDb } from "./client";
import type { MissionSummary } from "./index";
import { missionState } from "./mission-state";

export type CampaignSummary = {
  slug: string;
  pathSlug: string;
  technologyName: string;
  title: string;
  subtitle: string;
  storyIntro: string;
  theme: string;
  visualConfig: string;
  zoneTitle: string;
  completedMissions: number;
  totalMissions: number;
  progress: number;
};

export type CampaignLore = {
  loreTitle: string;
  loreSubtitle: string;
  sender: string;
  introText: string;
  shortDescription: string;
  signature: string;
  transmissionId: string;
};

export type CampaignNode = {
  zoneId: number;
  missionSlug: string;
  missionTitle: string;
  skillName: string;
  xpReward: number;
  enemyName: string;
  enemyType: "enemy" | "elite" | "boss";
  enemyLevel: number;
  enemyIntro: string;
  battleDialogue: string;
  sortOrder: number;
  missionState: MissionSummary["state"];
};

export type CampaignZone = {
  id: number;
  slug: string;
  title: string;
  storyIntro: string;
  storyOutro: string;
  sortOrder: number;
  bossProjectSlug: string | null;
  bossProjectTitle: string | null;
  nodes: CampaignNode[];
  progress: number;
};

export type CampaignView = Omit<CampaignSummary, "zoneTitle" | "completedMissions" | "totalMissions" | "progress"> & {
  lore: CampaignLore;
  loreSeen: boolean;
  recommendations: string[];
  zones: CampaignZone[];
  progress: number;
};

export async function getCampaignSummaries(userId: string): Promise<CampaignSummary[]> {
  const result = await getDb().prepare(`SELECT c.slug,lp.slug AS pathSlug,t.name AS technologyName,c.title,c.subtitle,
    c.story_intro AS storyIntro,c.theme,c.visual_config AS visualConfig,MIN(cz.title) AS zoneTitle,
    SUM(CASE WHEN um.state='completed' THEN 1 ELSE 0 END) AS completedMissions,COUNT(m.id) AS totalMissions
    FROM campaigns c JOIN technologies t ON t.id=c.technology_id JOIN learning_paths lp ON lp.id=c.learning_path_id
    JOIN campaign_zones cz ON cz.campaign_id=c.id AND cz.status='published'
    JOIN mission_battle_configs mbc ON mbc.zone_id=cz.id JOIN missions m ON m.id=mbc.mission_id AND m.status='published'
    LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
    WHERE c.status='published' GROUP BY c.id ORDER BY c.sort_order`).bind(userId).all<Omit<CampaignSummary, "progress">>();
  return result.results.map((campaign) => ({ ...campaign, progress: campaign.totalMissions ? Math.round(campaign.completedMissions / campaign.totalMissions * 100) : 0 }));
}

export async function getCampaign(userId: string, pathSlug: string): Promise<CampaignView | null> {
  const db = getDb();
  const campaign = await db.prepare(`SELECT c.id,c.slug,lp.slug AS pathSlug,t.name AS technologyName,c.title,c.subtitle,
    c.story_intro AS storyIntro,c.theme,c.visual_config AS visualConfig,c.lore_title AS loreTitle,
    c.lore_subtitle AS loreSubtitle,c.lore_sender AS loreSender,c.lore_intro_text AS loreIntroText,
    c.lore_short_description AS loreShortDescription,c.lore_signature AS loreSignature,
    c.lore_transmission_id AS loreTransmissionId,ulp.lore_seen_at AS loreSeenAt
    FROM campaigns c JOIN technologies t ON t.id=c.technology_id JOIN learning_paths lp ON lp.id=c.learning_path_id
    LEFT JOIN user_learning_paths ulp ON ulp.learning_path_id=lp.id AND ulp.user_id=?
    WHERE lp.slug=? AND c.status='published'`).bind(userId, pathSlug).first<Omit<CampaignView, "recommendations" | "zones" | "progress" | "lore" | "loreSeen"> & { id: number; loreTitle: string; loreSubtitle: string; loreSender: string; loreIntroText: string; loreShortDescription: string; loreSignature: string; loreTransmissionId: string; loreSeenAt: string | null }>();
  if (!campaign) return null;

  const [zonesResult, nodesResult, recommendationsResult] = await Promise.all([
    db.prepare(`SELECT cz.id,cz.slug,cz.title,cz.story_intro AS storyIntro,cz.story_outro AS storyOutro,cz.sort_order AS sortOrder,
      p.slug AS bossProjectSlug,p.title AS bossProjectTitle FROM campaign_zones cz
      LEFT JOIN projects p ON p.id=cz.boss_project_id WHERE cz.campaign_id=? AND cz.status='published' ORDER BY cz.sort_order`).bind(campaign.id).all<Omit<CampaignZone, "nodes" | "progress">>(),
    db.prepare(`SELECT cz.id AS zoneId,m.slug AS missionSlug,m.title AS missionTitle,s.name AS skillName,m.xp_reward AS xpReward,
      mbc.enemy_name AS enemyName,mbc.enemy_type AS enemyType,mbc.enemy_level AS enemyLevel,
      mbc.enemy_intro AS enemyIntro,mbc.battle_dialogue AS battleDialogue,mbc.sort_order AS sortOrder,${missionState} AS missionState
      FROM campaign_zones cz JOIN mission_battle_configs mbc ON mbc.zone_id=cz.id
      JOIN missions m ON m.id=mbc.mission_id JOIN skills s ON s.id=m.skill_id
      LEFT JOIN user_missions um ON um.mission_id=m.id AND um.user_id=?
      WHERE cz.campaign_id=? AND m.status='published' ORDER BY cz.sort_order,mbc.sort_order`).bind(userId, userId, campaign.id).all<CampaignNode>(),
    db.prepare(`SELECT t.name FROM campaign_recommendations cr JOIN technologies t ON t.id=cr.recommended_technology_id
      WHERE cr.campaign_id=? ORDER BY t.name`).bind(campaign.id).all<{ name: string }>(),
  ]);

  const zones = zonesResult.results.map((zone) => {
    const nodes = nodesResult.results.filter((node) => node.zoneId === zone.id);
    const completed = nodes.filter((node) => node.missionState === "completed").length;
    return { ...zone, nodes, progress: nodes.length ? Math.round(completed / nodes.length * 100) : 0 };
  });
  const total = zones.reduce((sum, zone) => sum + zone.nodes.length, 0);
  const completed = zones.reduce((sum, zone) => sum + zone.nodes.filter((node) => node.missionState === "completed").length, 0);
  const { loreTitle, loreSubtitle, loreSender, loreIntroText, loreShortDescription, loreSignature, loreTransmissionId, loreSeenAt, ...summary } = campaign;
  return { ...summary, lore: { loreTitle, loreSubtitle, sender: loreSender, introText: loreIntroText, shortDescription: loreShortDescription, signature: loreSignature, transmissionId: loreTransmissionId }, loreSeen: Boolean(loreSeenAt), recommendations: recommendationsResult.results.map((item) => item.name), zones, progress: total ? Math.round(completed / total * 100) : 0 };
}

export async function markCampaignLoreSeen(userId: string, pathSlug: string) {
  const path = await getDb().prepare(`SELECT id FROM learning_paths WHERE slug=? AND status='published'`).bind(pathSlug).first<{ id: number }>();
  if (!path) return false;
  await getDb().prepare(`UPDATE user_learning_paths SET lore_seen_at=COALESCE(lore_seen_at,CURRENT_TIMESTAMP) WHERE user_id=? AND learning_path_id=?`).bind(userId, path.id).run();
  return true;
}
