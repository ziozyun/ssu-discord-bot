const assert = require("node:assert/strict");
const test = require("node:test");

const { pruneDispatchCache } = require("./cache");

test("не змінює кеш, якщо він не перевищив ліміт", () => {
  const cache = new Map([["message-1", 1]]);

  assert.equal(pruneDispatchCache(cache), false);
  assert.deepEqual(cache, new Map([["message-1", 1]]));
});

test("повертає true, якщо обрізав кеш", () => {
  const cache = new Map(Array.from({ length: 1001 }, (_, index) => [`message-${index}`, index]));

  assert.equal(pruneDispatchCache(cache), true);
  assert.equal(cache.size, 1000);
  assert.equal(cache.has("message-0"), false);
});
