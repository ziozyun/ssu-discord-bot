const assert = require("node:assert/strict");
const test = require("node:test");

const { INTERROGATION_REPORT, countInterrogationParticipants } = require("./interrogation");

test("рахує проведення допиту для автора і участь для згаданих користувачів", () => {
  const result = countInterrogationParticipants([
    createMessage({
      authorId: "user-1",
      mentionedUsers: [{ id: "user-1" }, { id: "user-2" }, { id: "user-3" }],
    }),
    createMessage({
      authorId: "user-2",
      mentionedUsers: [{ id: "user-3" }],
    }),
  ]);

  assert.deepEqual(result, [
    {
      userId: "user-2",
      count: {
        conducted: 1,
        participated: 1,
      },
    },
    {
      userId: "user-3",
      count: {
        conducted: 0,
        participated: 2,
      },
    },
    {
      userId: "user-1",
      count: {
        conducted: 1,
        participated: 0,
      },
    },
  ]);
});

test("не дублює учасника допиту в межах одного повідомлення", () => {
  const result = countInterrogationParticipants([
    createMessage({
      authorId: "user-1",
      mentionedUsers: [{ id: "user-2" }, { id: "user-2" }],
    }),
  ]);

  assert.deepEqual(result, [
    {
      userId: "user-1",
      count: {
        conducted: 1,
        participated: 0,
      },
    },
    {
      userId: "user-2",
      count: {
        conducted: 0,
        participated: 1,
      },
    },
  ]);
});

test("фільтрує службові повідомлення меж звітного тижня для допитів", () => {
  assert.equal(
    INTERROGATION_REPORT.filterMessage({
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
    content: "Допит",
    mentions: {
      users: {
        values: () => mentionedUsers.map((user) => ({ bot: false, ...user })).values(),
      },
    },
  };
}
