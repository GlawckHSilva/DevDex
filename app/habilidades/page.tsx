import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { getCodeMemoryReview, getSkillTree } from "@/db";
import { SkillTree } from "./skill-tree";

export const metadata = { title: "Árvore de habilidades" };
export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const user = await requireChatGPTUser("/habilidades");
  const [{ nodes, progression }, codeMemory] = await Promise.all([getSkillTree(user.userId), getCodeMemoryReview(user.userId)]);
  return <main className="skills-page"><nav><a className="brand" href="/dashboard"><span className="brand-mark">D_</span>DevDex</a><a href="/dashboard">← Voltar ao dashboard</a></nav><header><span className="kicker">NEXO DE PROGRESSÃO</span><h1>Árvore de habilidades</h1><p>Escolha vantagens estratégicas sem pular o aprendizado.</p><div className="skill-summary"><strong>LV. {progression.level}</strong><span>◇ {progression.skillPoints} pontos disponíveis</span><span>❤️ {progression.hearts}/{progression.maxHearts}</span><span>💡 {progression.hints}/{progression.maxHints}</span></div></header><SkillTree nodes={nodes} level={progression.level} points={progression.skillPoints} />{codeMemory ? <section className="code-memory"><span className="kicker">MEMÓRIA DE CÓDIGO</span><h2>Revisão pessoal</h2>{codeMemory.length ? codeMemory.map((attempt, index) => <details key={`${attempt.createdAt}-${index}`}><summary><b>{attempt.passed ? "✓" : "×"}</b> {attempt.title}<small>{attempt.createdAt}</small></summary><p>{attempt.explanation}</p><pre><code>{attempt.sourceCode}</code></pre></details>) : <p>Suas próximas tentativas ficarão disponíveis aqui para revisão.</p>}</section> : null}</main>;
}
