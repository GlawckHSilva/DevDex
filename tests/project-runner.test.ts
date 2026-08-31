import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import type { ProjectFiles, ProjectValidator } from "../lib/runners/project-adapter";

const bytes = await readFile(new URL("../node_modules/@jitl/quickjs-wasmfile-release-sync/dist/emscripten-module.wasm", import.meta.url));
(globalThis as typeof globalThis & { __DEVDEX_QUICKJS_WASM__?: WebAssembly.Module }).__DEVDEX_QUICKJS_WASM__ = await WebAssembly.compile(bytes);
const { ProjectRunnerAdapter } = await import("../lib/runners/project-adapter");

const html = '<main class="todo-app"><form id="task-form"><input id="task-input" type="text"><button type="submit">Adicionar</button></form><ul id="task-list"></ul></main>';
const css = ".todo-app { max-width: 480px; padding: 24px; background-color: #fff; border-radius: 16px; }";
const script = `
const form=document.getElementById("task-form"),input=document.getElementById("task-input"),list=document.getElementById("task-list");
let tasks=JSON.parse(localStorage.getItem("tasks")||"[]");
function save(){localStorage.setItem("tasks",JSON.stringify(tasks));}
function render(text){const li=document.createElement("li");li.textContent=text;const button=document.createElement("button");button.textContent="Remover";button.addEventListener("click",()=>{li.remove();tasks=tasks.filter((task)=>task!==text);save();});li.appendChild(button);list.appendChild(li);}
tasks.forEach(render);
form.addEventListener("submit",(event)=>{event.preventDefault();if(!input.value.trim())return;tasks.push(input.value);render(input.value);save();input.value="";});`;
const files: ProjectFiles = { "index.html": html, "style.css": css, "script.js": script };

const validators: ProjectValidator[] = [
  { kind: "html", rules: [{ type: "element", tag: "form", attributes: { id: "task-form" } }, { type: "element", tag: "ul", attributes: { id: "task-list" } }] },
  { kind: "css", rules: [{ type: "style", selector: ".todo-app", declarations: { "max-width": "480px", padding: "24px" } }] },
  { kind: "javascript", test: "add" },
  { kind: "javascript", test: "remove" },
  { kind: "javascript", test: "persist" },
];

test("validates every To-do project stage in isolated adapters", async () => {
  for (const validator of validators) assert.equal((await ProjectRunnerAdapter.execute({ files, validator })).passed, true);
});

test("rejects incomplete behavior and active HTML", async () => {
  assert.equal((await ProjectRunnerAdapter.execute({ files: { ...files, "script.js": "" }, validator: { kind: "javascript", test: "add" } })).passed, false);
  await assert.rejects(() => ProjectRunnerAdapter.execute({ files: { ...files, "index.html": "<script>alert(1)</script>" } }), /tag <script>/i);
});

test("validates responsive project criteria without executing CSS", async () => {
  const responsive = { ...files, "style.css": "@media (max-width: 600px) { .todo-app { padding: 16px; } }" };
  assert.equal((await ProjectRunnerAdapter.execute({ files: responsive, validator: { kind: "css", rules: [{ type: "raw", pattern: "@media\\s*\\([^)]*max-width\\s*:\\s*600px" }] } })).passed, true);
});
