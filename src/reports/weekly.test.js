const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { runWeeklyReports } = require("./weekly");
const { ARREST_REPORT_ID } = require("./definitions/arrest");
const { INTERROGATION_REPORT_ID } = require("./definitions/interrogation");
const { NEGOTIATION_REPORT_ID } = require("./definitions/negotiation");
const { SEARCH_REPORT_ID } = require("./definitions/search");
const { TRUCK_BATTLE_REPORT_ID } = require("./definitions/truck-battle");
const { VEHICLE_ACTIVITY_REPORT_ID } = require("./definitions/vehicle-activity");

test("запускає налаштовані звіти для поточного тижня", async () => {
  const client = {
    channels: {
      fetch: async () => createFakeChannel([createMessage("1", "2026-04-14T10:00:00.000Z")]),
    },
  };

  const summary = await runWeeklyReports({
    client,
    now: () => new Date("2026-04-15T12:30:00"),
    reports: [
      {
        id: "test-report",
        channelIds: ["channel-a"],
        buildResult: (messages) => ({ count: messages.length }),
      },
    ],
    writeRows: async () => ({ updatedRows: 0 }),
  });

  assert.equal(summary.period.startDate.toString(), new Date("2026-04-13T00:00:00").toString());
  assert.equal(summary.reports.length, 1);
  assert.equal(summary.reports[0].reportId, "test-report");
  assert.deepEqual(summary.reports[0].result, { count: 1 });
});

test("формує зведений тижневий звіт і записує на аркуш Тест", async () => {
  const writeRequests = [];
  const channels = new Map([
    [
      "vehicle-channel",
      createFakeChannel([
        createMessage("1", "2026-04-14T10:00:00.000Z", {
          authorId: "user-2",
          mentionedUsers: [{ id: "user-1" }],
        }),
      ]),
    ],
    [
      "arrest-channel",
      createFakeChannel([
        createMessage("2", "2026-04-14T11:00:00.000Z", {
          authorId: "user-1",
          mentionedUsers: [{ id: "user-3" }],
        }),
      ]),
    ],
    [
      "interrogation-channel",
      createFakeChannel([
        createMessage("3", "2026-04-14T12:00:00.000Z", {
          authorId: "user-3",
          mentionedUsers: [{ id: "user-1" }],
        }),
      ]),
    ],
    [
      "search-channel",
      createFakeChannel([
        createMessage("4", "2026-04-14T13:00:00.000Z", {
          authorId: "user-2",
          mentionedUsers: [{ id: "user-3" }],
        }),
      ]),
    ],
    [
      "negotiation-channel",
      createFakeChannel([
        createMessage("5", "2026-04-14T14:00:00.000Z", {
          authorId: "user-1",
          mentionedUsers: [{ id: "user-2" }],
        }),
      ]),
    ],
    [
      "truck-battle-channel",
      createFakeChannel([
        createMessage("6", "2026-04-14T15:00:00.000Z", {
          authorId: "user-2",
          mentionedUsers: [{ id: "user-1" }],
        }),
      ]),
    ],
  ]);
  const client = {
    channels: {
      fetch: async (channelId) => channels.get(channelId),
    },
    users: {
      fetch: async (userId) => ({
        username: {
          "user-1": "Bohdan",
          "user-2": "Andrii",
          "user-3": "Serhii",
        }[userId],
      }),
    },
  };

  const summary = await runWeeklyReports({
    client,
    now: () => new Date("2026-04-15T12:30:00"),
    reports: [
      {
        id: VEHICLE_ACTIVITY_REPORT_ID,
        channelIds: ["vehicle-channel"],
        buildResult: (messages) => ({
          participants: [
            { count: messages.length, userId: "user-2" },
            { count: messages.length, userId: "user-1" },
          ],
        }),
      },
      {
        id: ARREST_REPORT_ID,
        channelIds: ["arrest-channel"],
        buildResult: (messages) => ({
          participants: [
            { count: messages.length, userId: "user-1" },
            { count: messages.length, userId: "user-3" },
          ],
        }),
      },
      {
        id: INTERROGATION_REPORT_ID,
        channelIds: ["interrogation-channel"],
        buildResult: (messages) => ({
          participants: [
            {
              count: {
                conducted: messages.length,
                participated: 0,
              },
              userId: "user-3",
            },
            {
              count: {
                conducted: 0,
                participated: messages.length,
              },
              userId: "user-1",
            },
          ],
        }),
      },
      {
        id: SEARCH_REPORT_ID,
        channelIds: ["search-channel"],
        buildResult: (messages) => ({
          participants: [
            { count: messages.length, userId: "user-2" },
            { count: messages.length, userId: "user-3" },
          ],
        }),
      },
      {
        id: NEGOTIATION_REPORT_ID,
        channelIds: ["negotiation-channel"],
        buildResult: (messages) => ({
          participants: [
            {
              count: {
                conducted: messages.length,
                controlled: 0,
              },
              userId: "user-1",
            },
            {
              count: {
                conducted: 0,
                controlled: messages.length,
              },
              userId: "user-2",
            },
          ],
        }),
      },
      {
        id: TRUCK_BATTLE_REPORT_ID,
        channelIds: ["truck-battle-channel"],
        buildResult: (messages) => ({
          participants: [
            {
              count: {
                failed: 0,
                successful: messages.length,
              },
              userId: "user-2",
            },
            {
              count: {
                failed: messages.length,
                successful: 0,
              },
              userId: "user-1",
            },
          ],
        }),
      },
    ],
    writeRows: async (request) => {
      writeRequests.push(request);

      return { updatedRows: request.rows.length };
    },
  });

  assert.deepEqual(writeRequests, [
    {
      range: "'Тест'!A:Z",
      rows: [
        [
          "Ініціали",
          "Угонка/SOTW/Фургон",
          "Арешт",
          "Проведення допиту",
          "Участь в допиті",
          "Обшук",
          "Участь в організації та контроль перемовин",
          "Проведення перемовин",
          "Неуспішне БЗВ",
          "Успішне БЗВ",
          "Неуспішне ВЗХ",
          "Успішне ВЗХ",
          "ФЗ/ЗАХИСТ АВІАНОСЦЯ",
          "ПОСТАЧАННЯ",
          "Крах літака (участь)",
          "Крах літака (ящики)",
        ],
        ["Andrii", 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
        ["Bohdan", 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
        ["Serhii", 0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
    },
  ]);
  assert.deepEqual(summary.writeResult, { updatedRows: 4 });
});

function createFakeChannel(messages) {
  return {
    messages: {
      fetch: async ({ limit = 100, before } = {}) => {
        const startIndex = before
          ? messages.findIndex((message) => message.id === before) + 1
          : 0;
        const pageMessages = messages.slice(startIndex, startIndex + limit);

        return new Map(pageMessages.map((message) => [message.id, message]));
      },
    },
  };
}

function createMessage(id, createdAt, { authorId = "user-1", mentionedUsers = [] } = {}) {
  return {
    author: {
      bot: false,
      id: authorId,
    },
    id,
    mentions: {
      users: new Map(mentionedUsers.map((user) => [user.id, { bot: false, ...user }])),
    },
    createdTimestamp: new Date(createdAt).getTime(),
  };
}
