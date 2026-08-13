import { env } from "cloudflare:workers";

export type D1Result<T = unknown> = { results: T[]; success: boolean; meta?: { changes?: number } };
export type D1Statement = {
  bind(...values: unknown[]): D1Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
};
export type D1Database = { prepare(sql: string): D1Statement; batch(statements: D1Statement[]): Promise<D1Result[]> };

export function getDb(): D1Database {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("D1 binding DB is unavailable");
  return db;
}
