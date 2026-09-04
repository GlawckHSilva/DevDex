import Image from "next/image";
import { ArrowRight, BookOpenCheck, CheckCircle2, Code2, Flame, FolderGit2, Gamepad2, Heart, Lightbulb, Trophy, Zap } from "lucide-react";
import { FaCss3Alt, FaGithub, FaHtml5, FaPython } from "react-icons/fa";
import { SiJavascript, SiSqlite } from "react-icons/si";
import { chatGPTSignInPath } from "@/app/chatgpt-auth";

const tracks = [
  { title: "Git", detail: "Versionamento", icon: FaGithub, path: "github-fundamentals" },
  { title: "HTML", detail: "Estrutura", icon: FaHtml5, path: "html-fundamentals" },
  { title: "CSS", detail: "Interface", icon: FaCss3Alt, path: "css-fundamentals" },
  { title: "JavaScript", detail: "Lógica", icon: SiJavascript, path: "javascript-fundamentals" },
  { title: "SQL", detail: "Dados", icon: SiSqlite, path: "sql-fundamentals-sqlite" },
  { title: "Python", detail: "Engenharia", icon: FaPython, path: "python-fundamentals" },
] as const;

const stagesPerTrack = 150;
const contentsPerTrack = 24;
const maxHearts = 5;
const maxHints = 3;

export default function Home() {
  const stages = tracks.length * stagesPerTrack;
  const contents = tracks.length * contentsPerTrack;
  const startPath = chatGPTSignInPath("/dashboard");
  const challengePath = chatGPTSignInPath("/trilhas/html-fundamentals");
  return (
    <main className="landing-page">
      <nav className="nav landing-nav container" aria-label="Navegação principal">
        <a className="brand" href="/" aria-label="DevDex, início"><span className="brand-mark">D_</span><span>DevDex</span></a>
        <div className="nav-links landing-links"><a href="#jornada">Jornada</a><a href="#desafios">Desafios</a><a href="#projetos">Projetos</a><a href="/status">Status</a></div>
        <a className="button button-small button-ghost landing-login" href="/dashboard">Entrar</a>
      </nav>

      <section className="landing-hero container">
        <div className="landing-hero-copy">
          <div className="eyebrow"><span className="pulse" /> APRENDA · LUTE · EVOLUA</div>
          <h1>Aprenda programação.<br />Evolua como em um <em>jogo.</em></h1>
          <p>Resolva desafios, ganhe XP, suba de nível e construa projetos reais — escolhendo o que aprender no seu ritmo.</p>
          <div className="landing-hero-actions">
            <a className="button landing-primary" href={startPath} target="_top">Começar grátis <ArrowRight aria-hidden="true" /></a>
            <a className="button button-ghost" href={challengePath} target="_top"><Gamepad2 aria-hidden="true" /> Testar um desafio</a>
          </div>
          <div className="landing-proof"><span><CheckCircle2 aria-hidden="true" /> Sem instalação</span><span><CheckCircle2 aria-hidden="true" /> Progresso salvo</span><span><CheckCircle2 aria-hidden="true" /> Projetos reais</span></div>
        </div>
        <div className="landing-game-preview" aria-label="Prévia da progressão no DevDex">
          <div className="game-preview-top"><span>MISSÃO ATUAL</span><strong>NÍVEL 3</strong></div>
          <div className="game-preview-title"><div><small>HTML · RUÍNAS DA ESTRUTURA</small><h2>Guardião dos Formulários</h2></div><span className="preview-xp">+120 XP</span></div>
          <div className="preview-arena">
            <div className="preview-player"><Image src="/characters/adventurer-male-sprite-v2.png" alt="Aventureiro DevDex" width={180} height={230} priority /><span>VOCÊ</span></div>
            <div className="preview-versus">VS</div>
            <div className="preview-enemy"><Image src="/battles/enemies/espectro-do-esqueleto-v2.png" alt="Inimigo Espectro do Esqueleto" width={205} height={230} priority /><span>BUG CORROMPIDO</span></div>
          </div>
          <div className="preview-objective"><Code2 aria-hidden="true" /><div><small>OBJETIVO</small><strong>Crie um formulário acessível</strong></div><span>2/3</span></div>
          <div className="preview-hud"><span><Heart aria-hidden="true" fill="currentColor" /> 3/{maxHearts}</span><span><Flame aria-hidden="true" /> 7 dias</span><span><Lightbulb aria-hidden="true" /> 2/{maxHints} dicas</span></div>
        </div>
      </section>

      <section className="landing-statbar container" aria-label="Resumo da experiência"><div><Zap aria-hidden="true" /><span><strong>{formatNumber(stages)}</strong> etapas de progressão</span></div><div><Code2 aria-hidden="true" /><span><strong>{tracks.length}</strong> trilhas publicadas</span></div><div><BookOpenCheck aria-hidden="true" /><span><strong>{contents}</strong> conteúdos na Biblioteca</span></div><div><FolderGit2 aria-hidden="true" /><span><strong>1</strong> projeto para portfólio</span></div></section>

      <section className="landing-section container" id="jornada">
        <div className="landing-section-heading"><span className="kicker">MAPA ABERTO</span><h2>Seu mapa de aprendizado</h2><p>Todos os caminhos estão disponíveis desde o início. Escolha onde começar e acompanhe sua evolução.</p></div>
        <div className="learning-path"><div className="learning-path-line" aria-hidden="true" />
          {tracks.map(({ title, detail, icon: Icon, path }) => <a className="path-step available" href={chatGPTSignInPath(`/trilhas/${path}`)} key={title} target="_top"><span className="path-status">DISPONÍVEL</span><div className="path-node"><Icon aria-hidden="true" /></div><strong>{title}</strong><small>{detail}</small></a>)}
        </div>
      </section>

      <section className="landing-section landing-experience container" id="desafios">
        <div className="experience-copy"><span className="kicker">NÃO É SÓ ASSISTIR</span><h2>O conhecimento vira ação.</h2><p>Leia o essencial, escreva sua solução e receba feedback imediato. Acertou? O inimigo perde vida. Errou? Use uma dica, revise e tente outra vez.</p><a href={challengePath} target="_top">Entrar na primeira batalha <ArrowRight aria-hidden="true" /></a></div>
        <div className="experience-sequence" aria-label="Fluxo de aprendizado"><article><BookOpenCheck aria-hidden="true" /><span>01</span><h3>Material</h3><p>Teoria objetiva e exemplos.</p></article><i aria-hidden="true">→</i><article><Code2 aria-hidden="true" /><span>02</span><h3>Batalha</h3><p>Código executado de verdade.</p></article><i aria-hidden="true">→</i><article><Trophy aria-hidden="true" /><span>03</span><h3>Conquista</h3><p>XP, níveis e progresso salvo.</p></article></div>
      </section>

      <section className="landing-section container" id="projetos">
        <div className="project-feature"><div className="project-feature-copy"><span className="kicker">PROJECT MODE</span><h2>Construa algo que você pode mostrar.</h2><p>Projetos progressivos combinam tudo o que você aprendeu. Trabalhe na plataforma ou conecte seu repositório do GitHub para receber uma revisão estruturada.</p><ul><li><CheckCircle2 aria-hidden="true" /> Introdução e requisitos claros</li><li><CheckCircle2 aria-hidden="true" /> Autosave e progresso por etapas</li><li><CheckCircle2 aria-hidden="true" /> Revisão de implementação</li></ul><a className="button" href={startPath} target="_top">Começar minha jornada <ArrowRight aria-hidden="true" /></a></div>
          <div className="project-window" aria-label="Exemplo de projeto prático"><div className="project-window-bar"><i /><i /><i /><span>todo-app / README.md</span></div><div className="project-window-body"><small>PROJETO DESBLOQUEADO</small><h3>Lista de tarefas</h3><p>HTML + CSS + JavaScript</p><div className="project-progress"><span><b style={{ width: "72%" }} /></span><strong>72%</strong></div><div className="project-checks"><span>✓ Estrutura semântica</span><span>✓ Interface responsiva</span><span className="pending">○ Persistência local</span></div><div className="project-reward"><Trophy aria-hidden="true" /><span>RECOMPENSA<strong>+500 XP · Projeto no perfil</strong></span></div></div></div>
        </div>
      </section>

      <section className="landing-final container"><div><span className="kicker">SUA PRIMEIRA MISSÃO ESTÁ PRONTA</span><h2>Entre no mapa. Escreva seu primeiro código.</h2></div><a className="button landing-primary" href={startPath} target="_top">Começar grátis <ArrowRight aria-hidden="true" /></a></section>
      <footer className="footer container"><span className="brand"><span className="brand-mark">D_</span> DevDex</span><p>Aprendizado gamificado com código real.</p></footer>
    </main>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}
