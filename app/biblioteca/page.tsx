import { BookOpen, Clock3, Search, Star } from "lucide-react";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AuthenticatedSidebar } from "@/app/dashboard/authenticated-sidebar";
import { getLibraryOverview } from "@/db";

export const metadata = { title: "Biblioteca DevDex" };
export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; tecnologia?: string; favoritos?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const technology = params.tecnologia?.trim() ?? "";
  const favoritesOnly = params.favoritos === "1";
  const user = await requireChatGPTUser(`/biblioteca${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  const library = await getLibraryOverview(user.userId, query, technology, favoritesOnly);

  return <main className="dashboard-shell">
    <AuthenticatedSidebar user={user} activePath="/biblioteca" />
    <section className="library-page">
    <nav className="library-topbar"><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><div><a href="/dashboard">Campanhas</a><a className="active" href="/biblioteca">Biblioteca</a></div></nav>
    <header className="library-hero">
      <div><span className="kicker"><BookOpen size={14} /> BIBLIOTECA / DEVDEX</span><h1>Consulte sem sair da aventura.</h1><p>Teoria, sintaxe, exemplos e atalhos ligados diretamente às missões de cada tecnologia.</p></div>
      <aside><strong>{library.technologies.reduce((total, item) => total + item.contentCount, 0)}</strong><span>conteúdos indexados</span><small>{library.technologies.length} tecnologias</small></aside>
    </header>
    <section className="library-workspace">
      <form className="library-search" action="/biblioteca" method="get">
        <label><Search size={18} /><input name="q" defaultValue={query} placeholder="Busque map(), flexbox, SELECT, commit..." aria-label="Buscar na biblioteca" /></label>
        {technology ? <input type="hidden" name="tecnologia" value={technology} /> : null}
        <button type="submit">BUSCAR</button>
      </form>
      <div className="library-filters" aria-label="Filtrar tecnologia">
        <a className={!technology ? "active" : ""} href={libraryHref(query, "", favoritesOnly)}>Todos</a>
        {library.technologies.map((item) => <a className={technology === item.slug ? "active" : ""} href={libraryHref(query, item.slug, favoritesOnly)} key={item.slug}>{item.name}<small>{item.contentCount}</small></a>)}
        <a className={favoritesOnly ? "active favorite" : "favorite"} href={libraryHref(query, technology, !favoritesOnly)}><Star size={13} fill={favoritesOnly ? "currentColor" : "none"} /> Favoritos <small>{library.favoriteCount}</small></a>
      </div>
      {!query && !technology && !favoritesOnly ? <section className="library-review-queue"><header><div><span className="kicker">REVISÃO INTELIGENTE</span><h2>Fortaleça os pontos que podem enfraquecer.</h2></div><strong>{library.reviews.length ? `${library.reviews.length} revisões` : "Em dia"}</strong></header>{library.reviews.length ? <div>{library.reviews.map((item) => <a className={`priority-${item.priority}`} href={`/biblioteca/${item.slug}`} key={item.slug}><span>{priorityLabel(item.priority)} · {item.masteryPercent}% · {item.masteryState}</span><h3>{item.title}</h3><p>{item.reviewReason}</p><strong>{item.reviewLabel} →</strong></a>)}</div> : <p className="review-empty">Continue praticando. Suas revisões inteligentes aparecerão conforme surgirem sinais reais.</p>}</section> : null}
      {library.recent.length && !query && !technology && !favoritesOnly ? <section className="library-recent"><header><Clock3 size={15} /><strong>VISTOS RECENTEMENTE</strong></header><div>{library.recent.map((item) => <LibraryCard item={item} compact key={item.slug} />)}</div></section> : null}
      <details className="library-results" open={Boolean(query || technology || favoritesOnly)}>
        <summary><div><span className="kicker">{favoritesOnly ? "FAVORITOS" : query ? "RESULTADOS" : "CATÁLOGO"}</span><h2>{query ? `Busca por “${query}”` : technology ? library.technologies.find((item) => item.slug === technology)?.name : "Referência por tecnologia"}</h2></div><span><strong>{library.contents.length} encontrados</strong><span className="library-results-toggle"><span>Mostrar mais</span><span>Mostrar menos</span></span></span></summary>
        {library.contents.length ? <div className="library-grid">{library.contents.map((item) => <LibraryCard item={item} key={item.slug} />)}</div> : <div className="library-empty"><Search size={28} /><h3>Nenhum conteúdo encontrado</h3><p>Tente outro termo ou remova os filtros.</p><a href="/biblioteca">Limpar busca</a></div>}
      </details>
    </section>
    </section>
  </main>;
}

function LibraryCard({ item, compact = false }: { item: Awaited<ReturnType<typeof getLibraryOverview>>["contents"][number]; compact?: boolean }) {
  return <a className={`library-card${compact ? " compact" : ""}`} href={`/biblioteca/${item.slug}`}>
    <div><span>{item.technologyName}</span>{item.favorite ? <Star size={13} fill="currentColor" aria-label="Favorito" /> : null}</div>
    <h3>{item.title}</h3>{compact ? null : <p>{item.description}</p>}
    <footer><small>{item.zoneTitle ?? item.pathName}</small><em>{difficultyLabel(item.difficulty)}</em></footer>
  </a>;
}

function libraryHref(query: string, technology: string, favorites: boolean) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (technology) params.set("tecnologia", technology);
  if (favorites) params.set("favoritos", "1");
  const suffix = params.toString();
  return `/biblioteca${suffix ? `?${suffix}` : ""}`;
}

function difficultyLabel(value: string) {
  return ({ beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado", professional: "Profissional" } as Record<string, string>)[value] ?? value;
}

function priorityLabel(value: "low" | "medium" | "high") {
  return ({ high: "Alta prioridade", medium: "Prioridade média", low: "Preventiva" } as const)[value];
}
