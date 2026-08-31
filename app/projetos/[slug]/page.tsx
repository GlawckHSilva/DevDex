import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getProject, getProjectRepository } from "@/db";
import { ProjectWorkspace } from "./project-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ campaign?: string }> }) {
  const { slug } = await params;
  const requestedCampaign = (await searchParams).campaign;
  const campaignPath = requestedCampaign && /^[a-z0-9-]+$/.test(requestedCampaign) ? requestedCampaign : null;
  const user = await requireChatGPTUser(`/projetos/${slug}`);
  const project = await getProject(user.userId, slug);
  if (!project) notFound();
  if (project.state === "locked") return <main className="workspace-page project-gate-page">
    <header className="workspace-header project-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>PROJECT MODE · BLOQUEADO</small><strong>{project.title}</strong></div></header>
    <section className="project-locked"><span className="kicker">PRÓXIMA CONQUISTA</span><h1>{project.title}</h1><p>{project.introduction}</p><div><strong>Nível {project.minLevel}</strong><strong>{project.requiredMaterials} materiais concluídos</strong><strong>{project.requiredBattles} batalhas vencidas</strong></div><small>Quando cumprir os requisitos, você receberá uma notificação de projeto liberado.</small><a className="button" href="/dashboard">CONTINUAR NAS CAMPANHAS</a></section>
  </main>;
  const activeStep = project.steps.find((step) => step.state === "available" || step.state === "in_progress") ?? project.steps.at(-1);
  if (!activeStep) notFound();
  const repository = await getProjectRepository(user.userId, project.id) ?? null;

  return <main className="workspace-page">
    <header className="workspace-header project-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>{campaignPath ? `BOSS BATTLE · ${project.title.toUpperCase()}` : "PROJECT MODE"}</small><strong>{activeStep.title}</strong></div><span className="workspace-xp">{project.completedSteps}/{project.steps.length} ETAPAS</span></header>
    <ProjectWorkspace project={{
      slug: project.slug, title: project.title, description: project.description, introduction: project.introduction, deadlineDays: project.deadlineDays, state: project.state, completedSteps: project.completedSteps,
      files: project.files,
      repository,
      steps: project.steps.map(({ slug: stepSlug, title, briefing, objective, activeFile, requirementsJson, xpReward, state }) => ({ slug: stepSlug, title, briefing, objective, activeFile, requirements: JSON.parse(requirementsJson) as string[], xpReward, state })),
    }} backHref={campaignPath ? `/trilhas/${campaignPath}` : "/dashboard"} />
  </main>;
}
