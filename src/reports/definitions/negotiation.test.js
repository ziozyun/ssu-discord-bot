const assert = require("node:assert/strict");
const test = require("node:test");

const { NEGOTIATION_REPORT, countNegotiationParticipants } = require("./negotiation");

test("рахує проведення перемовин для автора і контроль для згаданих користувачів", () => {
  const result = countNegotiationParticipants([
    createMessage({
      authorId: "user-1",
      mentionedUsers: [{ id: "user-1" }, { id: "user-2" }, { id: "user-3" }],
    }),
    createMessage({
      authorId: "user-2",
      mentionedUsers: [{ id: "user-3" }, { id: "user-3" }],
    }),
  ]);

  assert.deepEqual(result, [
    {
      userId: "user-2",
      count: {
        conducted: 1,
        controlled: 1,
      },
    },
    {
      userId: "user-3",
      count: {
        conducted: 0,
        controlled: 2,
      },
    },
    {
      userId: "user-1",
      count: {
        conducted: 1,
        controlled: 0,
      },
    },
  ]);
});

test("фільтрує службові повідомлення меж звітного тижня для перемовин", () => {
  assert.equal(
    NEGOTIATION_REPORT.filterMessage({
      content: "КІНЕЦЬ ЗВІТУВАННЯ ЗА [23.02.2026 - 01.03.2026] ТИЖДЕНЬ.",
    }),
    false,
  );
});

function createMessage({ authorId, mentionedUsers = [] }) {
  return {
    author: {
      bot: false,
      id: authorId,
    },
    content: "Перемовини",
    mentions: {
      users: {
        values: () => mentionedUsers.map((user) => ({ bot: false, ...user })).values(),
      },
    },
  };
}
