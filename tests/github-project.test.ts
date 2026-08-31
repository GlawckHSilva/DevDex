import assert from "node:assert/strict";
import test from "node:test";
import { fetchPublicProject, parseGitHubRepository } from "../lib/github-project";

test("accepts only canonical github repository URLs", () => {
  assert.deepEqual(parseGitHubRepository("https://github.com/DevDex/aluno.git"), { owner: "DevDex", repo: "aluno", repositoryUrl: "https://github.com/DevDex/aluno" });
  for (const invalid of ["https://gitlab.com/a/b", "https://github.com/a", "javascript:alert(1)"]) assert.throws(() => parseGitHubRepository(invalid));
});

test("reviews the three project files from one immutable public commit", async () => {
  const sha = "a".repeat(40);
  const requests: string[] = [];
  const fetcher = (async (input: string | URL | Request) => {
    const url = String(input); requests.push(url);
    if (url.endsWith("/repos/aluno/projeto")) return Response.json({ private: false, default_branch: "main" });
    if (url.endsWith("/commits/main")) return Response.json({ sha });
    return new Response(url.includes("index.html") ? "<main></main>" : url.includes("style.css") ? "main{}" : "const ok=true;");
  }) as typeof fetch;
  const snapshot = await fetchPublicProject("https://github.com/aluno/projeto", "", fetcher);
  assert.equal(snapshot.commitSha, sha);
  assert.deepEqual(Object.keys(snapshot.files), ["index.html", "style.css", "script.js"]);
  assert.equal(requests.filter((url) => url.includes(`/contents/`) && url.endsWith(`?ref=${sha}`)).length, 3);
});

test("rejects private repositories before reading files", async () => {
  const fetcher = (async () => Response.json({ private: true, default_branch: "main" })) as typeof fetch;
  await assert.rejects(() => fetchPublicProject("https://github.com/aluno/privado", "", fetcher), /público/i);
});
