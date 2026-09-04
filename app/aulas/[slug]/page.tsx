import { notFound } from "next/navigation";
import { BookOpen, CirclePlay, Download, ExternalLink, Swords } from "lucide-react";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AuthenticatedSidebar } from "@/app/dashboard/authenticated-sidebar";
import { getStudyLesson } from "@/db";
import { getLessonVideoResources } from "@/lib/video-resources";

export const dynamic = "force-dynamic";

export default async function StudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/aulas/${slug}`);
  const lesson = await getStudyLesson(user.userId, slug);
  if (!lesson) notFound();
  if (lesson.state === "locked") return <main className="dashboard-shell"><AuthenticatedSidebar user={user} activePath={`/trilhas/${lesson.pathSlug}`} /><section className="app-page container"><a className="back" href={`/trilhas/${lesson.pathSlug}`}>← Voltar ao mapa</a><h2>Material bloqueado</h2><p className="notice">Derrote os inimigos anteriores para liberar este estudo.</p></section></main>;
  const videos = getLessonVideoResources(lesson.slug, lesson.pathSlug);
  const commonErrors = lesson.body.commonErrors?.length ? lesson.body.commonErrors : ["Copiar o exemplo sem adaptar ao objetivo proposto.", "Ignorar os requisitos e não testar pequenas mudanças durante a implementação."];

  return <main className="dashboard-shell">
    <AuthenticatedSidebar user={user} activePath={`/trilhas/${lesson.pathSlug}`} />
    <section className="study-page">
    <nav className="study-topbar"><a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a><a href={`/trilhas/${lesson.pathSlug}`}>← Voltar ao mapa</a></nav>
    <header className="study-hero"><div><span><BookOpen size={16} /> MATERIAL DE ESTUDO</span><h1>{lesson.title}</h1><p>{lesson.body.introduction}</p></div><strong>GUIA + FONTES + EXEMPLOS</strong></header>
    <div className="study-layout">
      <article className="study-article">
        {lesson.body.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        <section><h2>Exemplo funcionando</h2><pre><code>{lesson.body.exampleCode}</code></pre></section>
        <section><h2>Entendendo o código</h2><ul>{lesson.body.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></section>
        <section><h2>Erros comuns</h2><ul className="study-errors">{commonErrors.map((error) => <li key={error}>{error}</li>)}</ul></section>
        {videos.length ? <section><h2>Vídeo opcional</h2><div className="study-videos">{videos.map((video) => <a href={video.url} target="_blank" rel="noreferrer" key={video.url}><CirclePlay size={24} /><span><small>ASSISTIR EXPLICAÇÃO</small><strong>{video.title}</strong><em>{video.teacher} · {video.provider}</em></span><ExternalLink size={16} /></a>)}</div></section> : null}
        <section><h2>Prática rápida</h2><p>Reescreva o exemplo sem copiar e altere uma parte por vez para confirmar que entendeu o conceito.</p></section>
        <section><h2>Missões e batalhas deste bloco</h2><ol>{lesson.body.practiceObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ol></section>
        <section><h2>Resumo e referência</h2><a className="study-pdf" href={lesson.body.pdfUrl} target="_blank" rel="noreferrer"><Download size={20} /><span><strong>Abrir resumo em PDF</strong><small>Material original do DevDex para consulta</small></span></a></section>
      </article>
      <aside className="study-resources">
        <span>REFERÊNCIAS DA ETAPA</span>
        {lesson.body.references.map((reference) => <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}><ExternalLink size={18} /><div><strong>{reference.label}</strong><small>Referência complementar</small></div></a>)}
        <div className="study-next"><strong>Depois deste material</strong><p>Você enfrentará cinco batalhas progressivas que aplicam exatamente estes conceitos.</p></div>
      </aside>
    </div>
    <form className="study-complete" action={`/api/lessons/${lesson.slug}/complete`} method="post"><p>{lesson.state === "completed" ? "Material já concluído. Você pode revisá-lo sempre que quiser." : "Quando estiver preparado, libere o bloco prático."}</p><button className="button" type="submit"><Swords size={18} /> {lesson.state === "completed" ? "VOLTAR ÀS BATALHAS" : "CONCLUIR ESTUDO E TREINAR"}</button></form>
    </section>
  </main>;
}
