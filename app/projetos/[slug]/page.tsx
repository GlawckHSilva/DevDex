import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getProject } from "@/db";
import { ProjectWorkspace } from "./project-workspace";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/projetos/${slug}`);
  const project = await getProject(user.userId, slug);
  if (!project) notFound();
  const activeStep = project.steps.find((step) => step.state === "available" || step.state === "in_progress") ?? project.steps.at(-1);
  if (!activeStep) notFound();

  return <main className="workspace-page">
    <header className="workspace-header project-header"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><small>PROJECT MODE · TO-DO APP</small><strong>{activeStep.title}</strong></div><span className="workspace-xp">{project.completedSteps}/{project.steps.length} ETAPAS</span></header>
    <ProjectWorkspace project={{
      slug: project.slug, title: project.title, description: project.description, state: project.state, completedSteps: project.completedSteps,
      files: project.files,
      steps: project.steps.map(({ slug: stepSlug, title, briefing, objective, activeFile, requirementsJson, xpReward, state }) => ({ slug: stepSlug, title, briefing, objective, activeFile, requirements: JSON.parse(requirementsJson) as string[], xpReward, state })),
    }} />
  </main>;
}
