import { parse } from "acorn";

type Node = { type: string; [key: string]: unknown };
type Value = number | boolean;

export function compileSafeFunction(code: string, functionName: string, parameters: string[]) {
  if (code.length > 10_000) throw new Error("O código ultrapassa o limite de 10 KB.");
  const program = parse(code, { ecmaVersion: "latest" }) as unknown as { body: Node[] };
  if (program.body.length !== 1 || program.body[0].type !== "FunctionDeclaration") throw new Error("Declare apenas a função solicitada.");
  const fn = program.body[0];
  const id = fn.id as Node | undefined;
  const params = fn.params as Node[] | undefined;
  const body = fn.body as { body?: Node[] } | undefined;
  if (id?.name !== functionName) throw new Error(`A função deve se chamar ${functionName}.`);
  if (!params || params.length !== parameters.length || params.some((param, index) => param.type !== "Identifier" || param.name !== parameters[index])) throw new Error(`Use exatamente os parâmetros: ${parameters.join(", ")}.`);
  if (!body?.body || body.body.length !== 1 || body.body[0].type !== "ReturnStatement") throw new Error("Use uma única instrução return dentro da função.");
  const expression = body.body[0].argument as Node | undefined;
  if (!expression) throw new Error("A função precisa retornar um valor.");
  validate(expression, new Set(parameters));

  return (...values: Value[]): Value => {
    const scope = Object.fromEntries(parameters.map((parameter, index) => [parameter, values[index]]));
    return evaluate(expression, scope);
  };
}

function validate(node: Node, parameters: Set<string>): void {
  if (node.type === "Literal" && (typeof node.value === "number" || typeof node.value === "boolean")) return;
  if (node.type === "Identifier" && typeof node.name === "string" && parameters.has(node.name)) return;
  const operators = new Set(["+", "-", "*", "/", ">", ">=", "<", "<=", "===", "!=="]);
  if (node.type !== "BinaryExpression" || typeof node.operator !== "string" || !operators.has(node.operator)) throw new Error("Use apenas valores, parâmetros e operadores permitidos.");
  validate(node.left as Node, parameters);
  validate(node.right as Node, parameters);
}

function evaluate(node: Node, scope: Record<string, Value>): Value {
  if (node.type === "Literal" && (typeof node.value === "number" || typeof node.value === "boolean")) return node.value;
  if (node.type === "Identifier" && typeof node.name === "string" && node.name in scope) return scope[node.name];
  if (node.type !== "BinaryExpression") throw new Error("Use apenas valores, parâmetros e operadores permitidos.");
  const left = evaluate(node.left as Node, scope);
  const right = evaluate(node.right as Node, scope);
  switch (node.operator) {
    case "+": return Number(left) + Number(right);
    case "-": return Number(left) - Number(right);
    case "*": return Number(left) * Number(right);
    case "/": return Number(left) / Number(right);
    case ">": return Number(left) > Number(right);
    case ">=": return Number(left) >= Number(right);
    case "<": return Number(left) < Number(right);
    case "<=": return Number(left) <= Number(right);
    case "===": return left === right;
    case "!==": return left !== right;
    default: throw new Error("Operador não permitido nesta missão.");
  }
}
