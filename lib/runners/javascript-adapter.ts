import { executeJavaScript } from "@/lib/quickjs-runner";
import type { JavaScriptTest } from "@/lib/quickjs-runner-core";
import type { RunnerAdapter } from "./types";

type Input = { code: string; functionName: string; tests?: JavaScriptTest[] };

export const JavaScriptRunnerAdapter: RunnerAdapter<Input, { name: string; passed: boolean }[]> = {
  runtime: "javascript",
  version: "javascript-quickjs-1",
  execute: ({ code, functionName, tests = [] }) => executeJavaScript(code, functionName, tests),
};
