import assert from "node:assert/strict";
import test from "node:test";
import { getLessonVideoResources } from "../lib/video-resources";

test("relaciona vídeos somente aos slugs curados", () => {
  const html = getLessonVideoResources("html-estudo-estrutura-documento", "html-fundamentals");
  assert.equal(html.length, 2);
  assert.equal(html[0].teacher, "Gustavo Guanabara");
  assert.equal(getLessonVideoResources("html-estudo-formularios", "html-fundamentals").length, 0);
});

test("aceita mais de um vídeo para o mesmo tópico", () => {
  const sql = getLessonVideoResources("sql-estudo-select-projecao", "sql-fundamentals-sqlite");
  assert.deepEqual(sql.map((video) => video.url), [
    "https://www.youtube.com/watch?v=GaOlyL3Uv9M",
    "https://www.youtube.com/watch?v=q4hPo83-Buo",
  ]);
});

test("respeita a tecnologia mesmo quando tópicos possuem o mesmo nome", () => {
  assert.equal(getLessonVideoResources("javascript-estudo-modelagem-dados", "javascript-fundamentals").length, 0);
  assert.equal(getLessonVideoResources("estudo-modelagem-dados", "python-fundamentals").length, 1);
});
