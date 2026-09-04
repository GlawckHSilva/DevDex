import { ArrowLeft, BookOpen, Code2, Map, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AuthenticatedSidebar } from "@/app/dashboard/authenticated-sidebar";
import { getLibraryContent, recordContentView } from "@/db";

export const dynamic = "force-dynamic";

export default async function LibraryContentPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ quiz?: string; intervalo?: string }> }) {
  const { slug } = await params;
  const feedback = await searchParams;
  const user = await requireChatGPTUser(`/biblioteca/${slug}`);
  const content = await getLibraryContent(user.userId, slug);
  if (!content) notFound();
  await recordContentView(user.userId, content.id);

  const sections = content.lessonBody?.sections ?? [];
  const keyPoints = content.lessonBody?.keyPoints ?? [];
  return <main className="dashboard-shell">
    <AuthenticatedSidebar user={user} activePath="/biblioteca" />
    <section className="library-detail-page">
    <nav className="library-topbar"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><a href="/biblioteca"><ArrowLeft size={15} /> Biblioteca</a><a href={`/trilhas/${content.pathSlug}`}><Map size={15} /> Mapa</a></div></nav>
    <header className="library-detail-hero">
      <div><span className="kicker">{content.technologyName} · {content.zoneTitle ?? content.pathName}</span><h1>{content.title}</h1><p>{content.description}</p><div className="library-tags">{content.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
      <form action={`/api/library/${content.slug}/favorite`} method="post"><button className={content.favorite ? "favorite active" : "favorite"} type="submit"><Star size={17} fill={content.favorite ? "currentColor" : "none"} /> {content.favorite ? "SALVO" : "FAVORITAR"}</button></form>
    </header>
    <div className="library-detail-layout">
      <article className="library-reference">
        <section><span className="reference-label"><BookOpen size={15} /> O QUE É</span><p>{content.theory || content.description}</p></section>
        {sections.slice(1).map((section) => <section key={section.title}><h2>{section.title}</h2><p>{section.text}</p></section>)}
        {content.syntax && !content.snippets.some((snippet) => snippet.code === content.syntax) ? <section><span className="reference-label"><Code2 size={15} /> SINTAXE / EXEMPLO</span><pre><code>{content.syntax}</code></pre></section> : null}
        {content.examples.map((example) => <section key={`${example.title}-${example.exampleType}`}><h2>{example.title}</h2><pre><code>{example.code}</code></pre><p>{example.explanation}</p></section>)}
        {keyPoints.length ? <section><h2>Pontos importantes</h2><ul>{keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></section> : null}
        {content.commonMistakes.length ? <section><h2>Erros comuns</h2><ul>{content.commonMistakes.map((mistake) => <li key={mistake}>{mistake}</li>)}</ul></section> : null}
        {content.comparisons.length ? <section><h2>Compare com</h2><ul>{content.comparisons.map((comparison) => <li key={comparison}>{comparison}</li>)}</ul></section> : null}
        {content.quiz ? <section className="library-quiz"><span className="reference-label">REVISÃO RÁPIDA</span><h2>{content.quiz.question}</h2>
          {feedback.quiz ? <p className={feedback.quiz === "correto" ? "quiz-correct" : "quiz-wrong"}>{feedback.quiz === "correto" ? `✓ Resposta correta. Próxima revisão em ${feedback.intervalo ?? 1} dia(s).` : "Ainda não. Revise os pontos importantes e tente novamente."}</p> : null}
          <form action={`/api/library/${content.slug}/quiz`} method="post">{content.quiz.options.map((option, index) => <label key={option}><input type="radio" name="answer" value={index} required /><span>{option}</span></label>)}<button type="submit">CONFIRMAR RESPOSTA</button></form>
        </section> : null}
      </article>
      <aside className="library-detail-aside">
        <div><span>QUANDO USAR</span><p>{content.whenToUse || "Use como referência durante a prática e nas revisões."}</p></div>
        {content.snippets.length ? <div><span>SNIPPETS</span>{content.snippets.map((snippet) => <article key={snippet.title}><strong>{snippet.title}</strong><small>{snippet.language}</small><pre><code>{snippet.code}</code></pre></article>)}</div> : null}
        {content.prerequisites.length ? <div><span>PRÉ-REQUISITOS</span>{content.prerequisites.map((item) => <a href={`/biblioteca/${item.slug}`} key={item.slug}>{item.title}<small>{item.technologyName}</small></a>)}</div> : null}
        <div className="library-related"><span>CONTINUAR APRENDENDO</span>{content.missionSlug ? <a className="button" href={`/missoes/${content.missionSlug}`}>IR PARA A MISSÃO →</a> : null}<a href={`/trilhas/${content.pathSlug}`}>Ver mapa da campanha</a></div>
      </aside>
    </div>
    </section>
  </main>;
}
