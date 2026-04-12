const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { fetchReportMessages } = require("./messages");

test("збирає повідомлення з каналів у межах звітного періоду", async () => {
  const period = {
    startDate: new Date("2026-04-13T00:00:00"),
    endDate: new Date("2026-04-19T23:59:59.999"),
  };
  const channels = new Map([
    [
      "channel-a",
      createFakeChannel([
        createMessage("3", "2026-04-20T00:00:00.000Z"),
        createMessage("2", "2026-04-14T10:00:00.000Z"),
        createMessage("1", "2026-04-12T20:59:59.999Z"),
      ]),
    ],
    [
      "channel-b",
      createFakeChannel([
        createMessage("5", "2026-04-15T08:00:00.000Z"),
        createMessage("4", "2026-04-13T00:00:00.000Z"),
      ]),
    ],
  ]);
  const client = {
    channels: {
      fetch: async (channelId) => channels.get(channelId),
    },
  };

  const messages = await fetchReportMessages({
    client,
    channelIds: ["channel-a", "channel-b"],
    period,
    pageLimit: 2,
  });

  assert.deepEqual(
    messages.map((message) => message.id),
    ["4", "2", "5"],
  );
});

function createFakeChannel(messages) {
  return {
    messages: {
      fetch: async ({ limit, before } = {}) => {
        const startIndex = before
          ? messages.findIndex((message) => message.id === before) + 1
          : 0;
        const pageMessages = messages.slice(startIndex, startIndex + limit);

        return new Map(pageMessages.map((message) => [message.id, message]));
      },
    },
  };
}

function createMessage(id, createdAt) {
  return {
    id,
    createdTimestamp: new Date(createdAt).getTime(),
  };
}
