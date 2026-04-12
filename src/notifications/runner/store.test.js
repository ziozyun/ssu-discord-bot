const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createDispatchCacheStore } = require("./store");

test("зберігає і читає кеш відправлених сповіщень з JSON-файлу", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "notification-cache-"));
  const filePath = path.join(directory, "cache.json");
  const store = createDispatchCacheStore({ filePath });
  const cache = new Map([
    ["message-1:2026-04-12T10:00:00.000Z", 1770000000000],
    ["message-2:2026-04-12T11:00:00.000Z", 1770000060000],
  ]);

  await store.writeCache(cache);

  assert.deepEqual(await store.readCache(), cache);
});

test("обрізає кеш до максимальної кількості записів", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "notification-cache-"));
  const filePath = path.join(directory, "cache.json");
  const store = createDispatchCacheStore({ filePath, maxEntries: 1 });
  const cache = new Map([
    ["old-message", 1],
    ["new-message", 2],
  ]);

  await store.writeCache(cache);

  assert.deepEqual(await store.readCache(), new Map([["new-message", 2]]));
});
