import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AuthenticatedSidebar } from "@/app/dashboard/authenticated-sidebar";
import { getProject, getProjectRepository, getUserProgression, hasGitHubInstallation } from "@/db";
import { getAIReviewConfig, getGitHubAppConfig } from "@/lib/runtime-config";
import { ProjectWorkspace } from "./project-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ campaign?: string }> }) {
  const { slug } = await params;
  const requestedCampaign = (await searchParams).campaign;
  const campaignPath = requestedCampaign && /^[a-z0-9-]+$/.test(requestedCampaign) ? requestedCampaign : null;
  const user = await requireChatGPTUser(`/projetos/${slug}`);
  const project = await getProject(user.userId, slug);
  if (!project) notFound();
  if (project.state === "locked") return <main className="dashboard-shell">
    <AuthenticatedSidebar user={user} activePath="/projetos/lista-de-tarefas" />
    <section className="workspace-page project-gate-page">
    <header className="workspace-header project-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>PROJECT MODE · BLOQUEADO</small><strong>{project.title}</strong></div></header>
    <section className="project-locked"><span className="kicker">PRÓXIMA CONQUISTA</span><h1>{project.title}</h1><p>{project.introduction}</p><div><strong>Nível {project.minLevel}</strong><strong>{project.requiredMaterials} materiais concluídos</strong><strong>{project.requiredBattles} batalhas vencidas</strong></div><small>Quando cumprir os requisitos, você receberá uma notificação de projeto liberado.</small><a className="button" href="/dashboard">CONTINUAR NAS CAMPANHAS</a></section>
    </section>
  </main>;
  const activeStep = project.steps.find((step) => step.state === "available" || step.state === "in_progress") ?? project.steps.at(-1);
  if (!activeStep) notFound();
  const [repository, githubConnected, progression] = await Promise.all([getProjectRepository(user.userId, project.id), hasGitHubInstallation(user.userId), getUserProgression(user.userId)]);

  return <main className="dashboard-shell">
    <AuthenticatedSidebar user={user} activePath="/projetos/lista-de-tarefas" />
    <section className="workspace-page">
    <header className="workspace-header project-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>{campaignPath ? `BOSS BATTLE · ${project.title.toUpperCase()}` : "PROJECT MODE"}</small><strong>{activeStep.title}</strong></div><span className="workspace-xp">❤️ {progression.hearts}/{progression.maxHearts} · {project.completedSteps}/{project.steps.length} ETAPAS</span></header>
    <ProjectWorkspace project={{
      slug: project.slug, title: project.title, description: project.description, introduction: project.introduction, deadlineDays: project.deadlineDays, state: project.state, completedSteps: project.completedSteps,
      files: project.files,
      repository,
      githubConnected, githubAppEnabled: getGitHubAppConfig().enabled, aiEnabled: getAIReviewConfig().enabled,
      steps: project.steps.map(({ slug: stepSlug, title, briefing, objective, activeFile, requirementsJson, xpReward, state }) => ({ slug: stepSlug, title, briefing, objective, activeFile, requirements: JSON.parse(requirementsJson) as string[], xpReward, state })),
    }} backHref={campaignPath ? `/trilhas/${campaignPath}` : "/dashboard"} />
    </section>
  </main>;
}
