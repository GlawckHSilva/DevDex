import { executeProjectJavaScript } from "@/lib/quickjs-runner";
import { WebRunnerAdapter, type WebValidationRule } from "./web-adapter";
import type { RunnerAdapter } from "./types";

export type ProjectFiles = { "index.html": string; "style.css": string; "script.js": string };
export type ProjectValidator = { kind: "html" | "css"; rules: WebValidationRule[] } | { kind: "javascript"; test: "add" | "remove" | "persist" };

export const ProjectRunnerAdapter: RunnerAdapter<{ files: ProjectFiles; validator?: ProjectValidator }, { passed: boolean; results: { passed: boolean }[] }> = {
  runtime: "project-web",
  version: "project-web-1",
  async execute({ files, validator }) {
    if (Object.values(files).some((source) => source.length > 12_000)) throw new Error("Um dos arquivos excede 12.000 caracteres.");
    await WebRunnerAdapter.execute({ code: files["index.html"], documentType: "html", maxLength: 12_000 });
    await WebRunnerAdapter.execute({ code: files["style.css"], documentType: "css", maxLength: 12_000 });
    if (!validator) return { passed: true, results: [] };
    const results = validator.kind === "javascript"
      ? await executeProjectJavaScript(files["script.js"], validator.test)
      : (await WebRunnerAdapter.execute({ code: files[validator.kind === "html" ? "index.html" : "style.css"], documentType: validator.kind, rules: validator.rules, maxLength: 12_000 })).results;
    return { passed: results.every((item) => item.passed), results };
  },
};
