const assert = require("node:assert/strict");
const test = require("node:test");

const {
  formatVehicleActivityRows,
  normalizeName,
  resolveReportUserName,
  resolveReportUserNames,
} = require("./user-names");

test("прибирає службові теги з початку імені", () => {
  assert.equal(normalizeName("[ЦСО A] Bohdan Barabolia"), "Bohdan Barabolia");
  assert.equal(normalizeName("[ВБОЗ] [A] Yakiv Chub"), "Yakiv Chub");
  assert.equal(normalizeName("  [ВБОЗ]   Vladyslav   Toga  "), "Vladyslav Toga");
});

test("бере ім'я з ініціалів користувача", async () => {
  const name = await resolveReportUserName("user-1", {
    userData: {
      "user-1": {
        initials: "Ihor Burevii",
      },
    },
  });

  assert.equal(name, "Ihor Burevii");
});

test("якщо ініціалів немає, бере ім'я з Discord", async () => {
  const previousGuildId = process.env.DISCORD_GUILD_ID;

  delete process.env.DISCORD_GUILD_ID;

  try {
  const name = await resolveReportUserName("user-1", {
    client: {
      users: {
        fetch: async () => ({
          displayName: "Discord Name",
          username: "discord_user",
        }),
      },
    },
    userData: {},
  });

  assert.equal(name, "Discord Name");
  } finally {
    if (previousGuildId === undefined) {
      delete process.env.DISCORD_GUILD_ID;
    } else {
      process.env.DISCORD_GUILD_ID = previousGuildId;
    }
  }
});

test("якщо ініціалів немає, бере ім'я користувача з Discord-сервера", async () => {
  const previousGuildId = process.env.DISCORD_GUILD_ID;

  process.env.DISCORD_GUILD_ID = "guild-1";

  try {
    const name = await resolveReportUserName("user-1", {
      client: {
        guilds: {
          fetch: async (guildId) => {
            assert.equal(guildId, "guild-1");

            return {
              members: {
                fetch: async (userId) => {
                  assert.equal(userId, "user-1");

                  return {
                    displayName: "Server Name",
                    user: {
                      username: "global_user",
                    },
                  };
                },
              },
            };
          },
        },
        users: {
          fetch: async () => {
            throw new Error("Не має доходити до global user fallback.");
          },
        },
      },
      userData: {},
    });

    assert.equal(name, "Server Name");
  } finally {
    if (previousGuildId === undefined) {
      delete process.env.DISCORD_GUILD_ID;
    } else {
      process.env.DISCORD_GUILD_ID = previousGuildId;
    }
  }
});

test("якщо guild id не заданий, шукає ім'я в кешованих Discord-серверах", async () => {
  const previousGuildId = process.env.DISCORD_GUILD_ID;

  delete process.env.DISCORD_GUILD_ID;

  try {
    const name = await resolveReportUserName("user-1", {
      client: {
        guilds: {
          cache: new Map([
            [
              "guild-1",
              {
                members: {
                  fetch: async (userId) => {
                    assert.equal(userId, "user-1");

                    return {
                      displayName: "Cached Server Name",
                    };
                  },
                },
              },
            ],
          ]),
        },
        users: {
          fetch: async () => {
            throw new Error("Не має доходити до global user fallback.");
          },
        },
      },
      userData: {},
    });

    assert.equal(name, "Cached Server Name");
  } finally {
    if (previousGuildId === undefined) {
      delete process.env.DISCORD_GUILD_ID;
    } else {
      process.env.DISCORD_GUILD_ID = previousGuildId;
    }
  }
});

test("сортує учасників за ім'ям і форматує рядки для таблиці", async () => {
  const participants = await resolveReportUserNames(
    [
      { count: 3, userId: "user-2" },
      { count: 1, userId: "user-1" },
    ],
    {
      client: {
        users: {
          fetch: async (userId) => ({
            username: userId === "user-1" ? "Bohdan" : "Andrii",
          }),
        },
      },
      store: {
        readAll: async () => ({}),
      },
    },
  );

  assert.deepEqual(formatVehicleActivityRows(participants), [
    ["Andrii", 3],
    ["Bohdan", 1],
  ]);
});
