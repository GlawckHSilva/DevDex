import { redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { avatars, ensureUser, getPlayerProfile } from "@/db";
import { AvatarPicker } from "./picker";

export const dynamic = "force-dynamic";

export default async function AvatarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await requireChatGPTUser("/avatar");
  await ensureUser(user);
  const profile = await getPlayerProfile(user.userId);
  const params = await searchParams;
  const next = params.next?.startsWith("/") ? params.next : "/jornada";
  if (profile?.avatarId) redirect(next);
  return <main className="avatar-page">
    <section className="avatar-intro">
      <a className="brand" href="/"><span className="brand-mark">D_</span>DevDex</a>
      <span className="kicker">INÍCIO DA JORNADA</span>
      <h1>Escolha quem vai<br />dominar o próximo bug.</h1>
      <p>Seu avatar é apenas visual: habilidades, XP e percurso de aprendizado continuam sendo seus.</p>
      <div className="mentor-bubble"><span className="mentor-pixel">DX</span><p><b>Dex:</b> testar ideias é sempre seguro. O ataque só acontece quando você decidir enviar a solução.</p></div>
    </section>
    <AvatarPicker avatars={avatars} next={next} />
  </main>;
}
