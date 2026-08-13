import type { QuickJSWASMModule } from "quickjs-emscripten-core";

export type JavaScriptTest = { name: string; input: unknown[]; expected: unknown };

const MEMORY_LIMIT = 16 * 1024 * 1024;
const STACK_LIMIT = 512 * 1024;
const TIME_LIMIT_MS = 250;

function sameValue(actual: unknown, expected: unknown): boolean {
  if (Object.is(actual, expected)) return true;
  if (Array.isArray(actual) && Array.isArray(expected)) {
    return actual.length === expected.length && actual.every((value, index) => sameValue(value, expected[index]));
  }
  if (actual && expected && typeof actual === "object" && typeof expected === "object") {
    const actualObject = actual as Record<string, unknown>;
    const expectedObject = expected as Record<string, unknown>;
    const keys = Object.keys(actualObject);
    return keys.length === Object.keys(expectedObject).length
      && keys.every((key) => Object.hasOwn(expectedObject, key) && sameValue(actualObject[key], expectedObject[key]));
  }
  return false;
}

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    return message === "interrupted" ? "O código excedeu o limite de execução." : message;
  }
  return "Não foi possível executar o código.";
}

export function runJavaScript(module: QuickJSWASMModule, code: string, functionName: string, tests: JavaScriptTest[]) {
  if (!/^[A-Za-z_$][\w$]*$/.test(functionName)) throw new Error("Nome de função inválido.");
  const runtime = module.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT);
  runtime.setMaxStackSize(STACK_LIMIT);
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const context = runtime.newContext();
  const deadline = Date.now() + TIME_LIMIT_MS;

  try {
    const setup = context.evalCode(`"use strict";\n${code}\n;typeof ${functionName} === "function"`, "submission.js");
    if (setup.error) {
      const error = context.dump(setup.error);
      setup.error.dispose();
      throw new Error(errorMessage(error));
    }
    const isFunction = context.dump(setup.value);
    setup.value.dispose();
    if (!isFunction) throw new Error(`Declare a função ${functionName}.`);

    return tests.map((test) => {
      const result = context.evalCode(`${functionName}(...${JSON.stringify(test.input)})`, "test.js");
      if (result.error) {
        const error = context.dump(result.error);
        result.error.dispose();
        throw new Error(errorMessage(error));
      }
      const actual = context.dump(result.value);
      result.value.dispose();
      return { name: test.name, passed: sameValue(actual, test.expected) };
    });
  } finally {
    context.dispose();
    runtime.dispose();
  }
}

const PROJECT_DOM = String.raw`
class Element {
  constructor(tagName, id = "") { this.tagName = tagName.toUpperCase(); this.id = id; this.value = ""; this.textContent = ""; this.children = []; this.parentNode = null; this.listeners = {}; }
  addEventListener(type, handler) { (this.listeners[type] ||= []).push(handler); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  append(...children) { children.forEach((child) => this.appendChild(child)); }
  remove() { if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this); }
  querySelector(selector) { if (selector === "button") return this.children.find((child) => child.tagName === "BUTTON") || null; return null; }
  dispatchEvent(event) { event.target = this; (this.listeners[event.type] || []).forEach((handler) => handler(event)); return true; }
  click() { this.dispatchEvent(new Event("click")); }
}
class Event { constructor(type) { this.type = type; this.defaultPrevented = false; this.target = null; } preventDefault() { this.defaultPrevented = true; } }
const __storage = {};
const localStorage = { getItem: (key) => Object.hasOwn(__storage, key) ? __storage[key] : null, setItem: (key, value) => { __storage[key] = String(value); }, removeItem: (key) => { delete __storage[key]; }, clear: () => { Object.keys(__storage).forEach((key) => delete __storage[key]); } };
let __elements;
function __resetDom() { __elements = { "task-form": new Element("form", "task-form"), "task-input": new Element("input", "task-input"), "task-list": new Element("ul", "task-list") }; }
__resetDom();
const document = { getElementById: (id) => __elements[id] || null, querySelector: (selector) => selector.startsWith("#") ? (__elements[selector.slice(1)] || null) : null, createElement: (tag) => new Element(tag) };
`;

export function runProjectJavaScript(module: QuickJSWASMModule, code: string, test: "add" | "remove" | "persist") {
  const runtime = module.newRuntime();
  runtime.setMemoryLimit(MEMORY_LIMIT);
  runtime.setMaxStackSize(STACK_LIMIT);
  runtime.setInterruptHandler(() => Date.now() > deadline);
  const context = runtime.newContext();
  const deadline = Date.now() + TIME_LIMIT_MS;
  const assertions = test === "add" ? [
    "__elements['task-list'].children.length === 1",
    "__elements['task-list'].children[0]?.textContent?.includes('Revisar código') === true",
  ] : test === "remove" ? [
    "__elements['task-list'].children.length === 1",
    "(__elements['task-list'].children[0]?.querySelector('button')?.click(), __elements['task-list'].children.length === 0)",
  ] : [
    "Object.keys(__storage).length > 0",
    "(__resetDom(), __student(), __elements['task-list'].children.some((item) => item.textContent.includes('Revisar código')))",
  ];
  try {
    const setup = context.evalCode(`${PROJECT_DOM}\nfunction __student(){\n${code}\n}\n__student();\n__elements["task-input"].value="Revisar código";\n__elements["task-form"].dispatchEvent(new Event("submit"));`, "project.js");
    if (setup.error) { const error = context.dump(setup.error); setup.error.dispose(); throw new Error(errorMessage(error)); }
    setup.value.dispose();
    return assertions.map((assertion) => {
      const result = context.evalCode(`Boolean(${assertion})`, "project-test.js");
      if (result.error) { const error = context.dump(result.error); result.error.dispose(); throw new Error(errorMessage(error)); }
      const passed = context.dump(result.value) === true;
      result.value.dispose();
      return { passed };
    });
  } finally { context.dispose(); runtime.dispose(); }
}
