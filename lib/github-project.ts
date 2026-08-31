import type { ProjectFiles } from "@/lib/runners/project-adapter";

const API = "https://api.github.com";
const FILES = ["index.html", "style.css", "script.js"] as const;
type Fetcher = typeof fetch;

export function parseGitHubRepository(value: string) {
  const match = /^https:\/\/github\.com\/([a-z\d](?:[a-z\d-]{0,38}))\/([a-z\d._-]{1,100}?)(?:\.git)?\/?$/i.exec(value.trim());
  if (!match) throw new Error("Use a URL pública no formato https://github.com/usuario/repositorio.");
  return { owner: match[1], repo: match[2], repositoryUrl: `https://github.com/${match[1]}/${match[2]}` };
}

function validBranch(value: string) {
  return value.length <= 100 && !value.startsWith("/") && !value.endsWith("/") && !value.includes("..") && /^[\w./-]+$/.test(value);
}

async function githubRequest(fetcher: Fetcher, path: string, accept = "application/vnd.github+json") {
  const response = await fetcher(`${API}${path}`, {
    headers: { Accept: accept, "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "DevDex-Project-Review" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (response.ok) return response;
  if (response.status === 403 || response.status === 429) throw new Error("O GitHub limitou as consultas agora. Aguarde alguns minutos e tente novamente.");
  if (response.status === 404) throw new Error("Repositório, branch ou arquivo não encontrado. Confirme que o repositório é público.");
  throw new Error("O GitHub não conseguiu fornecer esse projeto agora.");
}

export async function fetchPublicProject(repositoryUrl: string, requestedBranch = "", fetcher: Fetcher = fetch) {
  const repository = parseGitHubRepository(repositoryUrl);
  const base = `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;
  const metadata = await (await githubRequest(fetcher, base)).json() as { private?: boolean; default_branch?: string };
  if (metadata.private) throw new Error("Nesta etapa, use um repositório público.");
  const branch = requestedBranch.trim() || metadata.default_branch || "main";
  if (!validBranch(branch)) throw new Error("Informe um nome de branch válido.");
  const commit = await (await githubRequest(fetcher, `${base}/commits/${encodeURIComponent(branch)}`)).json() as { sha?: string };
  if (!commit.sha || !/^[a-f\d]{40}$/i.test(commit.sha)) throw new Error("Não foi possível identificar o commit da branch.");
  const entries = await Promise.all(FILES.map(async (path) => {
    const response = await githubRequest(fetcher, `${base}/contents/${path}?ref=${commit.sha}`, "application/vnd.github.raw+json");
    const source = await response.text();
    if (source.length > 12_000) throw new Error(`${path} excede o limite de 12.000 caracteres.`);
    return [path, source] as const;
  }));
  return { ...repository, branch, commitSha: commit.sha, files: Object.fromEntries(entries) as ProjectFiles };
}
