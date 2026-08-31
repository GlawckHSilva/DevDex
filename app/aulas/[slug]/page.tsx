import { notFound } from "next/navigation";
import { BookOpen, Download, ExternalLink, Swords } from "lucide-react";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getStudyLesson } from "@/db";

export const dynamic = "force-dynamic";

export default async function StudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireChatGPTUser(`/aulas/${slug}`);
  const lesson = await getStudyLesson(user.userId, slug);
  if (!lesson) notFound();
  if (lesson.state === "locked") return <main className="app-page container"><a className="back" href={`/trilhas/${lesson.pathSlug}`}>← Voltar ao mapa</a><h2>Material bloqueado</h2><p className="notice">Derrote os inimigos anteriores para liberar este estudo.</p></main>;

  return <main className="study-page">
    <nav className="study-topbar"><a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a><a href={`/trilhas/${lesson.pathSlug}`}>← Voltar ao mapa</a></nav>
    <header className="study-hero"><div><span><BookOpen size={16} /> MATERIAL DE ESTUDO</span><h1>{lesson.title}</h1><p>{lesson.body.introduction}</p></div><strong>GUIA + FONTES + EXEMPLOS</strong></header>
    <div className="study-layout">
      <article className="study-article">
        {lesson.body.sections.map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        <section><h2>Exemplo guiado</h2><pre><code>{lesson.body.exampleCode}</code></pre></section>
        <section><h2>O que você precisa dominar</h2><ul>{lesson.body.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></section>
        <section><h2>As cinco batalhas deste bloco</h2><ol>{lesson.body.practiceObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ol></section>
      </article>
      <aside className="study-resources">
        <span>RECURSOS DA ETAPA</span>
        <a href={lesson.body.pdfUrl} target="_blank" rel="noreferrer"><Download size={19} /><div><strong>Abrir guia em PDF</strong><small>Material original do DevDex</small></div></a>
        <a href={lesson.body.videoUrl} target="_blank" rel="noreferrer"><BookOpen size={19} /><div><strong>{lesson.body.videoLabel}</strong><small>Conteúdo externo selecionado</small></div></a>
        {lesson.body.references.map((reference) => <a href={reference.url} target="_blank" rel="noreferrer" key={reference.url}><ExternalLink size={18} /><div><strong>{reference.label}</strong><small>Referência complementar</small></div></a>)}
        <div className="study-next"><strong>Depois deste material</strong><p>Você enfrentará cinco batalhas progressivas que aplicam exatamente estes conceitos.</p></div>
      </aside>
    </div>
    <form className="study-complete" action={`/api/lessons/${lesson.slug}/complete`} method="post"><p>{lesson.state === "completed" ? "Material já concluído. Você pode revisá-lo sempre que quiser." : "Quando estiver preparado, libere o bloco prático."}</p><button className="button" type="submit"><Swords size={18} /> {lesson.state === "completed" ? "VOLTAR ÀS BATALHAS" : "CONCLUIR ESTUDO E TREINAR"}</button></form>
  </main>;
}
