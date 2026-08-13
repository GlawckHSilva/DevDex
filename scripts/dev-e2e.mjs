import { readdirSync, rmSync } from "node:fs";
import { resolve, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const state = resolve(root, "work/e2e-state");
const work = `${resolve(root, "work")}${sep}`;
if (!state.startsWith(work)) throw new Error("Diretório E2E inválido.");
rmSync(state, { recursive: true, force: true });

const wrangler = resolve(root, "node_modules/wrangler/bin/wrangler.js");
for (const file of readdirSync(resolve(root, "drizzle")).filter((name) => /^\d+.*\.sql$/.test(name)).sort()) {
  const result = spawnSync(process.execPath, [wrangler, "d1", "execute", "devdex-d1", "--local", "--file", `drizzle/${file}`, "--persist-to", "work/e2e-state", "--config", "tests/wrangler.e2e.jsonc"], { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const vinext = resolve(root, "node_modules/vinext/dist/cli.js");
const server = spawn(process.execPath, [vinext, "dev"], { cwd: root, env: { ...process.env, DEVDEX_E2E: "1" }, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
