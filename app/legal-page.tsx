import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="legal-page">
    <article>
      <a className="brand" href="/"><span className="brand-mark">D_</span><span>DevDex</span></a>
      <span className="kicker">INFORMAÇÕES LEGAIS</span>
      <h1>{title}</h1>
      {children}
      <a className="login-back" href="/">← Voltar ao início</a>
    </article>
  </main>;
}
