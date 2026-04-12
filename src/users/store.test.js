const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { createUserInfoStore } = require("./store");

test("зберігає й читає інформацію користувача з JSON-файлу", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ssu-discord-bot-users-"));
  const filePath = path.join(directory, "users.json");
  const store = createUserInfoStore({ filePath });

  await store.updateUser(
    "user-1",
    {
      cardNumber: "1111-1111",
    },
    { now: new Date("2026-04-12T10:00:00.000Z") },
  );
  await store.updateUser(
    "user-1",
    {
      initials: "Ihor Burevii",
    },
    { now: new Date("2026-04-12T11:00:00.000Z") },
  );

  assert.deepEqual(await store.getUser("user-1"), {
    cardNumber: "1111-1111",
    initials: "Ihor Burevii",
    updatedAt: "2026-04-12T11:00:00.000Z",
  });
  assert.deepEqual(JSON.parse(await fs.readFile(filePath, "utf8")), {
    "user-1": {
      cardNumber: "1111-1111",
      initials: "Ihor Burevii",
      updatedAt: "2026-04-12T11:00:00.000Z",
    },
  });
});
