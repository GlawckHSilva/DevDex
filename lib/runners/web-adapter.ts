import generate from "css-tree/generator";
import parseCss from "css-tree/parser";
import walk from "css-tree/walker";
import { parse, type DefaultTreeAdapterMap } from "parse5";
import type { RunnerAdapter } from "./types";

type HtmlRule = { type: "element"; tag: string; min?: number; textIncludes?: string; attributes?: Record<string, string> };
type CssRule = { type: "style"; selector: string; declarations: Record<string, string> };
type CssRawRule = { type: "raw"; pattern: string };
export type WebValidationRule = HtmlRule | CssRule | CssRawRule;
export type WebRunnerInput = { code: string; documentType: "html" | "css"; rules?: WebValidationRule[]; maxLength?: number };
export type WebRunnerOutput = { passed: boolean; results: { passed: boolean }[] };

const BLOCKED_TAGS = new Set(["script", "style", "iframe", "object", "embed", "link", "meta", "base", "svg", "math", "template"]);
const normalize = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();

function validateHtmlSafety(code: string) {
  const document = parse(code);
  const elements: DefaultTreeAdapterMap["element"][] = [];
  const visit = (node: DefaultTreeAdapterMap["node"]) => {
    if ("tagName" in node) {
      elements.push(node);
      if (BLOCKED_TAGS.has(node.tagName)) throw new Error(`A tag <${node.tagName}> não é permitida no preview.`);
      for (const attribute of node.attrs) {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim();
        if (name.startsWith("on") || ["srcdoc", "action", "formaction"].includes(name)) throw new Error(`O atributo ${name} não é permitido no preview.`);
        if (name === "src" && !/^data:image\/(?:png|gif|jpeg|webp);base64,/i.test(value)) throw new Error("Imagens externas não são permitidas no preview.");
        if ((name === "href" || name === "xlink:href") && value !== "" && !value.startsWith("#")) throw new Error("Links externos não são permitidos no preview.");
      }
    }
    if ("childNodes" in node) node.childNodes.forEach(visit);
  };
  visit(document);
  return elements;
}

function elementText(node: DefaultTreeAdapterMap["node"]): string {
  if ("value" in node) return node.value;
  return "childNodes" in node ? node.childNodes.map(elementText).join(" ") : "";
}

function validateHtml(code: string, rules: HtmlRule[]) {
  const elements = validateHtmlSafety(code);
  return rules.map((rule) => {
    const matches = elements.filter((element) => {
      if (element.tagName !== rule.tag.toLowerCase()) return false;
      if (rule.textIncludes && !normalize(elementText(element)).includes(normalize(rule.textIncludes))) return false;
      const attributes = Object.fromEntries(element.attrs.map(({ name, value }) => [name.toLowerCase(), value]));
      return Object.entries(rule.attributes ?? {}).every(([name, value]) => attributes[name.toLowerCase()] === value);
    });
    return { passed: matches.length >= (rule.min ?? 1) };
  });
}

function validateCss(code: string, rules: (CssRule | CssRawRule)[]) {
  if (/<\/style|@(?:import|keyframes|font-face|namespace|page|property)\b|url\s*\(|expression\s*\(|-moz-binding|behavior\s*:|animation(?:-name)?\s*:/i.test(code)) {
    throw new Error("Este recurso CSS não é permitido no preview isolado.");
  }
  const ast = parseCss(code, { context: "stylesheet", positions: false });
  const styles = new Map<string, Map<string, string>>();
  walk(ast, {
    visit: "Rule",
    enter(node) {
      if (node.type !== "Rule" || node.block.type !== "Block") return;
      const declarations = new Map<string, string>();
      node.block.children.forEach((child) => {
        if (child.type === "Declaration") declarations.set(child.property.toLowerCase(), normalize(generate(child.value)));
      });
      generate(node.prelude).split(",").forEach((selector) => styles.set(normalize(selector), declarations));
    },
  });
  return rules.map((rule) => {
    if (rule.type === "raw") return { passed: new RegExp(rule.pattern, "i").test(code) };
    const declarations = styles.get(normalize(rule.selector));
    return { passed: !!declarations && Object.entries(rule.declarations).every(([property, value]) => declarations.get(property.toLowerCase()) === normalize(value)) };
  });
}

export const WebRunnerAdapter: RunnerAdapter<WebRunnerInput, WebRunnerOutput> = {
  runtime: "web-preview",
  version: "web-parser-1",
  async execute(input) {
    if (input.code.length > (input.maxLength ?? 8_000)) throw new Error("O código excede o limite desta missão.");
    const rules = input.rules ?? [];
    const results = input.documentType === "html"
      ? validateHtml(input.code, rules.filter((rule): rule is HtmlRule => rule.type === "element"))
      : validateCss(input.code, rules.filter((rule): rule is CssRule | CssRawRule => rule.type === "style" || rule.type === "raw"));
    return { passed: results.every((result) => result.passed), results };
  },
};
