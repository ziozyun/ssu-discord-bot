const assert = require("node:assert/strict");
const test = require("node:test");

const { VEHICLE_ACTIVITY_REPORT } = require("./vehicle-activity");

test("формує результат для звіту Угонка/SOTW/Фургон", () => {
  const messages = [
    createMessage({ authorId: "user-1", mentionedUsers: [{ id: "user-2" }] }),
    createMessage({ authorId: "user-2", mentionedUsers: [{ id: "user-3" }] }),
  ];

  const result = VEHICLE_ACTIVITY_REPORT.buildResult(messages);

  assert.deepEqual(result, {
    participants: [
      { count: 2, userId: "user-2" },
      { count: 1, userId: "user-1" },
      { count: 1, userId: "user-3" },
    ],
  });
});

test("фільтрує службові повідомлення меж звітного тижня", () => {
  assert.equal(
    VEHICLE_ACTIVITY_REPORT.filterMessage({
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
    content: "Угонка",
    mentions: {
      users: new Map(mentionedUsers.map((user) => [user.id, { bot: false, ...user }])),
    },
  };
}
