import { redirect } from "next/navigation";
import { requireChatGPTUser } from "@/app/chatgpt-auth";
import { AuthenticatedSidebar } from "@/app/dashboard/authenticated-sidebar";
import { consumeGitHubConnectionState, saveGitHubInstallation } from "@/db";
import { exchangeAndVerifyInstallation } from "@/lib/github-app";

export const dynamic = "force-dynamic";

export default async function GitHubCallback({ searchParams }: { searchParams: Promise<{ code?: string; state?: string; installation_id?: string }> }) {
  const query = await searchParams;
  const returnTo = `/github/callback?code=${encodeURIComponent(query.code ?? "")}&state=${encodeURIComponent(query.state ?? "")}&installation_id=${encodeURIComponent(query.installation_id ?? "")}`;
  const user = await requireChatGPTUser(returnTo);
  try {
    const installationId = Number(query.installation_id);
    if (!query.code || !query.state || !Number.isSafeInteger(installationId) || installationId <= 0) throw new Error("Retorno do GitHub incompleto.");
    const connection = await consumeGitHubConnectionState(user.userId, query.state);
    if (!connection) throw new Error("Esta autorização expirou. Inicie a conexão novamente.");
    const installation = await exchangeAndVerifyInstallation(query.code, installationId);
    await saveGitHubInstallation(user.userId, installation.installationId, installation.accountLogin, installation.accountType);
    redirect(connection.returnPath);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return <main className="dashboard-shell"><AuthenticatedSidebar user={user} activePath="/projetos/lista-de-tarefas" /><section className="github-callback"><span className="kicker">GITHUB APP</span><h1>Não foi possível concluir a conexão</h1><p>{error instanceof Error ? error.message : "Tente novamente pelo projeto."}</p><a className="button" href="/dashboard">Voltar ao dashboard</a></section></main>;
  }
}
