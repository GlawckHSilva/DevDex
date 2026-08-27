const tracks = [
  ["HTML", "Semântica, formulários e acessibilidade", "01"],
  ["CSS", "Design systems, layouts e responsividade", "02"],
  ["JavaScript", "Lógica, coleções e aplicações", "03"],
  ["SQL", "Consultas, relações e análise de dados", "04"],
] as const;

export default function Home() {
  return (
    <main>
      <nav className="nav container" aria-label="Navegação principal">
        <a className="brand" href="/" aria-label="DevDex, início">
          <span className="brand-mark">D_</span><span>DevDex</span>
        </a>
        <div className="nav-links">
          <a href="#trilhas">Trilhas</a><a href="/status">Status</a>
          <a className="button button-small" href="/dashboard">Abrir plataforma</a>
        </div>
      </nav>

      <section className="hero container">
        <div className="eyebrow"><span className="pulse" /> Fase 1D · Project Mode ativo</div>
        <h1>Aprenda programação.<br /><span>Escrevendo código de verdade.</span></h1>
        <p className="hero-copy">Uma jornada gamificada por missões, desafios e projetos que ensina você a construir, testar e depurar software real.</p>
        <div className="hero-actions">
          <a className="button" href="/dashboard">Explorar fundação <span>→</span></a>
          <a className="button button-ghost" href="#arquitetura">Ver arquitetura</a>
        </div>

        <div className="terminal" aria-label="Exemplo de missão JavaScript">
          <div className="terminal-bar">
            <div className="terminal-dots"><i /><i /><i /></div><span>mission-01.js</span><span className="terminal-status">● TESTES</span>
          </div>
          <div className="code-grid">
            <pre><code><span className="muted">01</span> <span className="purple">function</span> <span className="blue">calcularTotal</span>(produtos) {'{'}{"\n"}<span className="muted">02</span>   <span className="purple">return</span> produtos.<span className="blue">reduce</span>((total, item) ={">"} {"\n"}<span className="muted">03</span>     total + item.valor, <span className="orange">0</span>{"\n"}<span className="muted">04</span>   );{"\n"}<span className="muted">05</span> {'}'}</code></pre>
            <div className="test-results"><small>RESULTADO DA MISSÃO</small><p><b>✓</b> soma dois produtos</p><p><b>✓</b> aceita lista vazia</p><p><b>✓</b> funciona com vários itens</p><div className="xp">MISSÃO CONCLUÍDA <strong>+120 XP</strong></div></div>
          </div>
        </div>
      </section>

      <section className="section container" id="trilhas">
        <div className="section-heading"><div><span className="kicker">CURRÍCULO COMPLETO</span><h2>Quatro cursos. Do básico ao profissional.</h2></div><p>30 aulas e 30 práticas em cada linguagem, organizadas por zonas e liberadas por pré-requisitos.</p></div>
        <div className="track-grid">
          {tracks.map(([title, description, number]) => <article className="track-card" key={title}><span className="track-number">{number}</span><div className="track-icon">{title.slice(0, 2)}</div><h3>{title}{title === "SQL" ? " · SQLite" : ""}</h3><p>{description}</p><span className="track-state">30 MISSÕES</span></article>)}
        </div>
      </section>

      <section className="section container">
        <div className="section-heading"><div><span className="kicker">JORNADA DE APRENDIZADO</span><h2>Do conceito ao projeto completo.</h2></div><p>Cada modo tem uma função clara e prepara o aluno para construir com mais autonomia.</p></div>
        <div className="mode-grid"><article><span>01</span><h3>Lessons</h3><p>Aprender conceitos.</p></article><article><span>02</span><h3>Challenges</h3><p>Praticar conceitos isolados.</p></article><article className="active"><span>03</span><h3>Projects</h3><p>Combinar vários conhecimentos.</p></article><article><span>04</span><h3>Boss Battles</h3><p>Construir praticamente sozinho.</p></article></div>
      </section>

      <section className="section container" id="arquitetura">
        <div className="architecture">
          <div><span className="kicker">ARQUITETURA EVOLUTIVA</span><h2>Preparado para crescer sem recomeçar.</h2><p>Currículo, progresso e execução são domínios separados. O código do aluno nunca roda junto da aplicação principal.</p></div>
          <div className="architecture-flow" aria-label="Fluxo da arquitetura"><span>WEB APP<small>React + TypeScript</small></span><i>→</i><span>PLATAFORMA<small>SIWC + D1</small></span><i>→</i><span>RUNNERS<small>QuickJS + SQLite + Web</small></span></div>
        </div>
      </section>

      <footer className="footer container"><span className="brand"><span className="brand-mark">D_</span> DevDex</span><p>Fundação do MVP · Agosto de 2026</p></footer>
    </main>
  );
}
