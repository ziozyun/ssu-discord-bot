const assert = require("node:assert/strict");
const test = require("node:test");

const { ARREST_REPORT } = require("./arrest");

test("формує результат для звіту Арешт", () => {
  const messages = [
    createMessage({ authorId: "user-1", mentionedUsers: [{ id: "user-2" }] }),
    createMessage({ authorId: "user-2", mentionedUsers: [{ id: "user-3" }] }),
  ];

  const result = ARREST_REPORT.buildResult(messages);

  assert.deepEqual(result, {
    participants: [
      { count: 2, userId: "user-2" },
      { count: 1, userId: "user-1" },
      { count: 1, userId: "user-3" },
    ],
  });
});

test("фільтрує службові повідомлення меж звітного тижня для арештів", () => {
  assert.equal(
    ARREST_REPORT.filterMessage({
      content: "ПОЧАТОК ЗВІТУВАННЯ ЗА [02.03.2026 - 08.03.2026] ТИЖДЕНЬ.",
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
    content: "Арешт",
    mentions: {
      users: new Map(mentionedUsers.map((user) => [user.id, { bot: false, ...user }])),
    },
  };
}
