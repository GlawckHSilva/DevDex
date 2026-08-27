import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const bytes = await readFile(new URL("../node_modules/sql.js/dist/sql-wasm.wasm", import.meta.url));
(globalThis as typeof globalThis & { __DEVDEX_SQLITE_WASM__?: WebAssembly.Module }).__DEVDEX_SQLITE_WASM__ = await WebAssembly.compile(bytes);
const { SqlRunnerAdapter } = await import("../lib/runners/sql-adapter");

const exercise = {
  schemaSql: "CREATE TABLE PRODUTOS (ID INTEGER PRIMARY KEY, NOME TEXT);",
  seedSql: "INSERT INTO PRODUTOS VALUES (1,'A'),(2,'B'),(3,'C'),(4,'D');",
  maxRows: 10,
  timeoutMs: 250,
};

test("runs SQLite SELECT and validates equivalent results", async () => {
  const result = await SqlRunnerAdapter.execute({ ...exercise, query: "select id, nome from produtos", expected: { columns: ["ID", "NOME"], rows: [[4, "D"], [3, "C"], [2, "B"], [1, "A"]], orderMatters: false } });
  assert.equal(result.passed, true);
  assert.equal(result.rows.length, 4);
});

test("rejects syntax errors, unknown tables and multiple statements", async () => {
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "SELECT FROM PRODUTOS" }), /syntax error/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "SELECT * FROM CLIENTES" }), /no such table: CLIENTES/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "SELECT NOMEE FROM PRODUTOS" }), /A coluna NOMEE não existe/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "SELECT * FROM PRODUTOS; SELECT 1" }), /somente um statement/i);
});

test("reports wrong results without granting a pass", async () => {
  const result = await SqlRunnerAdapter.execute({ ...exercise, query: "SELECT * FROM PRODUTOS WHERE ID=1", expected: { columns: ["ID", "NOME"], rows: [[2, "B"]], orderMatters: false } });
  assert.equal(result.passed, false);
});

test("limits rows, execution time and scope", async () => {
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, maxRows: 3, query: "SELECT * FROM PRODUTOS" }), /mais de 3 linhas/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, timeoutMs: -1, query: "SELECT * FROM PRODUTOS" }), /limite de execução/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "DELETE FROM PRODUTOS" }), /somente consultas de leitura/i);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: 'SELECT * FROM "sqlite_schema"' }), /fora do exercício/i);
});

test("supports professional read-only SQL with aggregates, CTEs and windows", async () => {
  const aggregate = await SqlRunnerAdapter.execute({ ...exercise, query: "SELECT COUNT(*) AS TOTAL FROM PRODUTOS", expected: { columns: ["TOTAL"], rows: [[4]], orderMatters: true } });
  assert.equal(aggregate.passed, true);
  const cte = await SqlRunnerAdapter.execute({ ...exercise, query: "WITH BASE AS (SELECT * FROM PRODUTOS WHERE ID>=2) SELECT NOME,ROW_NUMBER() OVER (ORDER BY ID) AS POSICAO FROM BASE ORDER BY ID" });
  assert.deepEqual(cte.rows, [["B", 1], ["C", 2], ["D", 3]]);
  await assert.rejects(() => SqlRunnerAdapter.execute({ ...exercise, query: "WITH X AS (SELECT 1) DELETE FROM PRODUTOS" }), /fora do exercício/i);
});

test("creates and discards a fresh database for every execution", async () => {
  const first = await SqlRunnerAdapter.execute({ ...exercise, query: "SELECT * FROM PRODUTOS WHERE ID=1" });
  const second = await SqlRunnerAdapter.execute({ ...exercise, query: "SELECT * FROM PRODUTOS" });
  assert.equal(first.rows.length, 1);
  assert.equal(second.rows.length, 4);
});
