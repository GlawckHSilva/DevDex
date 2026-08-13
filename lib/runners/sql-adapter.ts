import initSqlJs, { type SqlValue } from "sql.js";
import type { RunnerAdapter } from "./types";

export type SqlExpectedResult = { columns: string[]; rows: SqlValue[][]; orderMatters: boolean };
export type SqlRunnerInput = {
  query: string;
  schemaSql: string;
  seedSql: string;
  expected?: SqlExpectedResult;
  maxRows: number;
  timeoutMs: number;
  maxStatements?: number;
};
export type SqlRunnerOutput = { columns: string[]; rows: SqlValue[][]; passed: boolean | null; durationMs: number };

const MAX_QUERY_LENGTH = 4_000;
let sqlitePromise: ReturnType<typeof initSqlJs> | null = null;

function getSqlite() {
  const wasmModule = (globalThis as typeof globalThis & { __DEVDEX_SQLITE_WASM__?: WebAssembly.Module }).__DEVDEX_SQLITE_WASM__;
  if (!wasmModule) throw new Error("Runner SQLite indisponível.");
  sqlitePromise ??= initSqlJs({
    instantiateWasm(imports, success) {
      const instance = new WebAssembly.Instance(wasmModule, imports);
      success(instance);
      return instance.exports;
    },
  });
  return sqlitePromise;
}

function sanitize(query: string) {
  let result = "";
  let state: "normal" | "single" | "double" | "backtick" | "bracket" | "line" | "block" = "normal";
  for (let index = 0; index < query.length; index += 1) {
    const char = query[index];
    const next = query[index + 1];
    if (state === "normal") {
      if (char === "'" || char === '"' || char === "`" || char === "[") state = char === "'" ? "single" : char === '"' ? "double" : char === "`" ? "backtick" : "bracket";
      else if (char === "-" && next === "-") { state = "line"; result += "  "; index += 1; continue; }
      else if (char === "/" && next === "*") { state = "block"; result += "  "; index += 1; continue; }
      result += state === "normal" ? char : " ";
      continue;
    }
    if (state === "line" && (char === "\n" || char === "\r")) { state = "normal"; result += char; continue; }
    if (state === "block" && char === "*" && next === "/") { state = "normal"; result += "  "; index += 1; continue; }
    const closing = state === "single" ? "'" : state === "double" ? '"' : state === "backtick" ? "`" : state === "bracket" ? "]" : null;
    if (closing && char === closing) {
      if (next === closing && state !== "bracket") { result += "  "; index += 1; continue; }
      state = "normal";
    }
    result += " ";
  }
  if (state === "single" || state === "double" || state === "backtick" || state === "bracket" || state === "block") throw new Error("A consulta possui um texto ou comentário incompleto.");
  return result;
}

function validateQuery(query: string, maxStatements: number) {
  if (maxStatements !== 1) throw new Error("O runner suporta exatamente um statement nesta versão.");
  if (!query.trim()) throw new Error("Escreva uma consulta SELECT.");
  if (query.length > MAX_QUERY_LENGTH) throw new Error("A consulta excede 4.000 caracteres.");
  const safe = sanitize(query);
  const withoutTrailingSemicolon = safe.replace(/;\s*$/, "");
  if (withoutTrailingSemicolon.includes(";")) throw new Error("Execute somente um statement por vez.");
  if (!/^\s*SELECT\b/i.test(withoutTrailingSemicolon)) throw new Error("Nesta trilha, somente consultas SELECT são permitidas.");
  if (/\b(PRAGMA|ATTACH|DETACH|VACUUM|REINDEX|ANALYZE|load_extension|readfile|writefile)\b/i.test(safe) || /sqlite_(?:schema|master)/i.test(query)) throw new Error("A consulta tenta acessar um recurso fora do exercício.");
  const functionCall = safe.match(/\b([A-Za-z_]\w*)\s*\(/);
  if (functionCall && functionCall[1].toUpperCase() !== "IN") throw new Error("Funções e subconsultas ainda não fazem parte desta trilha.");
}

function normalize(result: { columns: string[]; rows: SqlValue[][] }, orderMatters: boolean) {
  const normalized = { columns: result.columns.map((column) => column.toLowerCase()), rows: result.rows };
  if (!orderMatters) normalized.rows = [...normalized.rows].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return normalized;
}

function sameResult(actual: { columns: string[]; rows: SqlValue[][] }, expected: SqlExpectedResult) {
  return JSON.stringify(normalize(actual, expected.orderMatters)) === JSON.stringify(normalize(expected, expected.orderMatters));
}

function educationalError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const column = message.match(/no such column:\s*([^\s]+)/i)?.[1];
  if (column) return new Error(`no such column: ${column}. A coluna ${column} não existe. Confira a estrutura da tabela.`);
  const table = message.match(/no such table:\s*([^\s]+)/i)?.[1];
  if (table) return new Error(`no such table: ${table}. Essa tabela não existe neste exercício.`);
  if (/syntax error/i.test(message)) return new Error(`${message} Revise as palavras-chave e a ordem da consulta.`);
  return error instanceof Error ? error : new Error("Não foi possível executar a consulta.");
}

export const SqlRunnerAdapter: RunnerAdapter<SqlRunnerInput, SqlRunnerOutput> = {
  runtime: "sqlite",
  version: "sqlite-wasm-1",
  async execute(input) {
    validateQuery(input.query, input.maxStatements ?? 1);
    const startedAt = Date.now();
    const deadline = startedAt + input.timeoutMs;
    const SQL = await getSqlite();
    const database = new SQL.Database();
    let statement: initSqlJs.Statement | null = null;
    try {
      database.run(input.schemaSql);
      database.run(input.seedSql);
      if (Date.now() > deadline) throw new Error("A consulta excedeu o limite de execução.");
      statement = database.prepare(input.query);
      const columns = statement.getColumnNames();
      const rows: SqlValue[][] = [];
      while (statement.step()) {
        if (Date.now() > deadline) throw new Error("A consulta excedeu o limite de execução.");
        if (rows.length >= input.maxRows) throw new Error(`A consulta retornou mais de ${input.maxRows} linhas.`);
        rows.push(statement.get());
      }
      const result = { columns, rows };
      return { ...result, passed: input.expected ? sameResult(result, input.expected) : null, durationMs: Date.now() - startedAt };
    } catch (error) {
      throw educationalError(error);
    } finally {
      statement?.free();
      database.close();
    }
  },
};
