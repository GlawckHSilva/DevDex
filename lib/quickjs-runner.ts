import baseVariant from "@jitl/quickjs-wasmfile-release-sync";
import { memoizePromiseFactory, newQuickJSWASMModuleFromVariant, newVariant } from "quickjs-emscripten-core";
import { runJavaScript, runProjectJavaScript, type JavaScriptTest } from "./quickjs-runner-core";

const getModule = memoizePromiseFactory(() => {
  const wasmModule = (globalThis as typeof globalThis & { __DEVDEX_QUICKJS_WASM__?: WebAssembly.Module }).__DEVDEX_QUICKJS_WASM__;
  if (!wasmModule) throw new Error("Runner JavaScript indisponível.");
  return newQuickJSWASMModuleFromVariant(newVariant(baseVariant, { wasmModule }));
});

export async function executeJavaScript(code: string, functionName: string, tests: JavaScriptTest[] = []) {
  return runJavaScript(await getModule(), code, functionName, tests);
}

export async function executeProjectJavaScript(code: string, test: "add" | "remove" | "persist") {
  return runProjectJavaScript(await getModule(), code, test);
}
