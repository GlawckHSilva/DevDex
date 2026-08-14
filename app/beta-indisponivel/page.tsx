export const metadata = { title: "Beta indisponível" };

export default async function BetaUnavailable({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const full = (await searchParams).reason === "full";
  return <main className="app-page container beta-message">
    <a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a>
    <span className="kicker">PUBLIC BETA</span>
    <h1>{full ? "As vagas atuais foram preenchidas." : "A beta está temporariamente pausada."}</h1>
    <p className="notice">Seu acesso não criou progresso incompleto. Volte quando uma nova vaga for liberada.</p>
    <a className="button" href="/">Voltar ao início</a>
  </main>;
}
