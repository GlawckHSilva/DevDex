import { AlertTriangle, CheckCircle2, Gauge, Target } from "lucide-react";
import type { ReactNode } from "react";
import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { getCampaignSummaries, getDashboard, getMasteryOverview, getUserReviewRecommendations, type MasteryConcept, type UserReviewRecommendation } from "@/db";
import { isAdminEmail } from "@/lib/runtime-config";
import { AppSidebar } from "../dashboard/sidebar";

export const metadata = { title: "Maestria técnica" };
export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const user = await requireChatGPTUser("/maestria");
  const [{ profile }, campaigns, mastery, reviews] = await Promise.all([
    getDashboard(user),
    getCampaignSummaries(user.userId),
    getMasteryOverview(user.userId),
    getUserReviewRecommendations(user.userId),
  ]);
  const reviewBySkill = new Map(reviews.map((item) => [item.skillId, item]));

  return <main className="dashboard-shell">
    <AppSidebar campaigns={campaigns} skillPoints={profile.skillPoints} admin={isAdminEmail(user.email)} signOutHref={chatGPTSignOutPath("/")} activePath="/maestria" />
    <section className="dashboard-content mastery-page">
      <header className="dashboard-top mastery-top">
        <div><span className="kicker">MAESTRIA TÉCNICA</span><h1>Veja o que você já domina de verdade.</h1><p>XP mede avanço global. Maestria mede consistência por conceito, com base em acertos, erros, dicas e revisões.</p></div>
        <a className="level-chip" href="/habilidades"><small>NÍVEL GLOBAL {profile.level}</small><strong>{profile.withinLevel} / {profile.required} XP</strong><div className="progress-track"><i style={{ width: `${profile.percent}%` }} /></div><span>◇ {profile.skillPoints} pontos disponíveis</span></a>
      </header>

      <section className="mastery-summary-grid" aria-label="Resumo de maestria">
        <SummaryCard icon={<Gauge />} label="Maestria média" value={`${mastery.overallMastery}%`} />
        <SummaryCard icon={<Target />} label="Conceitos praticados" value={`${mastery.practicedConcepts}/${mastery.totalConcepts}`} />
        <SummaryCard icon={<CheckCircle2 />} label="Pontos fortes" value={String(mastery.strengths.length)} />
        <SummaryCard icon={<AlertTriangle />} label="Revisões sugeridas" value={String(reviews.length)} />
      </section>

      <section className="mastery-insights">
        <InsightList title="Pontos fortes" empty="Complete mais missões para destacar seus domínios." items={mastery.strengths} />
        <RecommendationList items={reviews.slice(0, 4)} />
      </section>

      <div className="mission-list-heading"><div><span className="kicker">MAPA DE CONCEITOS</span><h2>Maestria por tecnologia</h2></div><span>{mastery.technologies.length} tecnologias</span></div>
      <section className="mastery-tech-list">
        {mastery.technologies.map((technology) => <details className="mastery-tech-card" key={technology.slug}>
          <summary><div><span>{technology.name}</span><h3>{technology.mastery}% de maestria</h3></div><div className="progress-track"><i style={{ width: `${technology.mastery}%` }} /></div><span className="mastery-toggle"><span>Mostrar mais</span><span>Mostrar menos</span></span></summary>
          <div className="mastery-concept-grid">
            {technology.concepts.map((concept) => <ConceptCard concept={concept} recommendation={reviewBySkill.get(concept.id)} key={concept.id} />)}
          </div>
        </details>)}
      </section>
    </section>
  </main>;
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <article className="mastery-summary-card"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function InsightList({ title, empty, items, review = false }: { title: string; empty: string; items: MasteryConcept[]; review?: boolean }) {
  return <article className="mastery-insight-card"><header><span className="kicker">{title}</span></header>{items.length ? items.map((item) => <div key={item.id}><strong>{item.name}</strong><span>{review ? "Revisão recomendada" : item.state} · {item.technologyName}</span></div>) : <p>{empty}</p>}</article>;
}

function RecommendationList({ items }: { items: UserReviewRecommendation[] }) {
  return <article className="mastery-insight-card"><header><span className="kicker">Pedir revisão</span></header>{items.length ? items.map((item) => <a className="mastery-review-link" href={`/biblioteca/${item.slug}`} key={item.id}><strong>{item.title}</strong><span>{item.reviewReason}</span></a>) : <p>Nenhum ponto crítico recente.</p>}</article>;
}

function ConceptCard({ concept, recommendation }: { concept: MasteryConcept; recommendation?: UserReviewRecommendation }) {
  return <div className={`mastery-concept-card state-${concept.state.toLowerCase()}`}>
    <header><span>{concept.pathName}</span><strong>{concept.mastery}%</strong></header>
    <h4>{concept.name}</h4>
    <p>{concept.zoneName ?? "Sem região vinculada"} · {concept.relatedActivities} atividade(s)</p>
    <div className="progress-track"><i style={{ width: `${concept.mastery}%` }} /></div>
    <footer><span>{concept.state}</span><small>{formatPracticeDate(concept.lastPracticeAt)}</small></footer>
    {recommendation ? <a className="mastery-review-badge" href={`/biblioteca/${recommendation.slug}`}>{recommendation.reviewLabel}</a> : null}
  </div>;
}

function formatPracticeDate(value: string | null) {
  if (!value) return "Ainda sem prática";
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? "Data indisponível" : `Última prática em ${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}
