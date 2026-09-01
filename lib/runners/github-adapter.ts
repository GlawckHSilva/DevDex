import type { RunnerAdapter } from "./types";

export type GitHubValidationRule = { all?: string[]; any?: string[]; ordered?: string[]; none?: string[] };
type GitHubTest = { name: string; expected: GitHubValidationRule };
type GitHubResult = { name: string; passed: boolean };

const normalize = (value: string) => value.normalize("NFKC").split(/\r?\n/).map((line) => line.trim().replace(/\s+/g, " ")).filter(Boolean).join("\n").toLocaleLowerCase("pt-BR");

function matches(source: string, rule: GitHubValidationRule) {
  const all = (rule.all ?? []).map(normalize);
  const any = (rule.any ?? []).map(normalize);
  const none = (rule.none ?? []).map(normalize);
  let cursor = 0;
  const ordered = (rule.ordered ?? []).map(normalize).every((fragment) => {
    const index = source.indexOf(fragment, cursor);
    if (index < 0) return false;
    cursor = index + fragment.length;
    return true;
  });
  return all.every((fragment) => source.includes(fragment))
    && (!any.length || any.some((fragment) => source.includes(fragment)))
    && none.every((fragment) => !source.includes(fragment))
    && ordered;
}

export const GitHubRunnerAdapter: RunnerAdapter<{ code: string; tests: GitHubTest[] }, GitHubResult[]> = {
  runtime: "github",
  version: "github-validator-1",
  async execute({ code, tests }) {
    if (!code.trim()) throw new Error("Escreva os comandos ou a configuração solicitada.");
    if (code.length > 12_000) throw new Error("A solução excede 12.000 caracteres.");
    if (/github_pat_[\w-]{20,}|gh[pousr]_[a-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/i.test(code)) throw new Error("Não envie tokens nem chaves privadas. Use apenas valores fictícios.");
    const source = normalize(code);
    return tests.map((test) => ({ name: test.name, passed: matches(source, test.expected) }));
  },
};
