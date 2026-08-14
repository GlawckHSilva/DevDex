import { notFound, redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getBattle, getCharacter, getMission, getSqlMissionConfig, getWebMissionConfig } from "@/db";
import { MissionWorkspace } from "./workspace";
import { SqlWorkspace } from "./sql-workspace";
import { WebWorkspace } from "./web-workspace";

export const dynamic = "force-dynamic";

export default async function MissionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <MissionContent slug={slug} />;
}

async function MissionContent({ slug }: { slug: string }) {
  const user = await requireChatGPTUser(`/missoes/${slug}`);
  const mission = await getMission(user.userId, slug);
  if (!mission) notFound();
  if (mission.state === "locked") return <main className="app-page container"><a className="back" href="/dashboard">← Dashboard</a><h2>Missão bloqueada</h2><p className="notice">Conclua a missão anterior para liberar este desafio.</p></main>;

  const sqlConfig = mission.runtime === "sqlite" ? await getSqlMissionConfig(mission.id) : null;
  const webConfig = mission.runtime === "html" || mission.runtime === "css" ? await getWebMissionConfig(mission.id) : null;
  const character = await getCharacter(user.userId);
  if (!character) redirect(`/trilhas/${mission.pathSlug}`);
  const battle = await getBattle(user.userId, mission.id, mission.state === "completed");
  if (mission.runtime === "sqlite" && !sqlConfig) notFound();
  if ((mission.runtime === "html" || mission.runtime === "css") && !webConfig) notFound();
  const pathLabel = `${mission.technologyName} · ${mission.campaignTitle}`;
  const battleView = battle ? { enemyName: battle.enemyName, enemyType: battle.enemyType, enemyLevel: battle.enemyLevel, lives: battle.lives, state: battle.state, archetype: character.archetype } : undefined;

  return <main className="workspace-page">
    <header className="workspace-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>{pathLabel}</small><strong>{mission.title}</strong></div><span className="workspace-xp">+{mission.xpReward} XP</span></header>
    {sqlConfig ? <SqlWorkspace mission={{ slug: mission.slug, title: mission.title, briefing: mission.briefing, objective: mission.objective, starterSql: sqlConfig.starterSql, completed: mission.state === "completed", nextMissionSlug: mission.nextMissionSlug, pathSlug: mission.pathSlug, dialect: sqlConfig.dialect, tableSchema: JSON.parse(sqlConfig.tableSchemaJson), tablePreview: JSON.parse(sqlConfig.tablePreviewJson) }} initialBattle={battleView} />
      : webConfig ? <WebWorkspace mission={{ slug: mission.slug, title: mission.title, briefing: mission.briefing, objective: mission.objective, starterCode: webConfig.starterCode, completed: mission.state === "completed", nextMissionSlug: mission.nextMissionSlug, pathSlug: mission.pathSlug, documentType: webConfig.documentType, previewHtml: webConfig.previewHtml, previewCss: webConfig.previewCss }} initialBattle={battleView} />
      : <MissionWorkspace mission={{ slug: mission.slug, pathSlug: mission.pathSlug, title: mission.title, briefing: mission.briefing, objective: mission.objective, starterCode: mission.starterCode, functionName: mission.functionName, completed: mission.state === "completed", nextMissionSlug: mission.nextMissionSlug }} initialBattle={battleView} />}
  </main>;
}
