const assert = require("node:assert/strict");
const test = require("node:test");

const {
  TRUCK_BATTLE_REPORT,
  countTruckBattleParticipants,
  getTruckBattleResultKey,
} = require("./truck-battle");

test("визначає успішне БЗВ по слову вдало без заперечення", () => {
  assert.equal(getTruckBattleResultKey("Вдало"), "successful");
  assert.equal(getTruckBattleResultKey("БЗВ вдало закрито"), "successful");
  assert.equal(getTruckBattleResultKey("бзв ВДАЛО"), "successful");
  assert.equal(getTruckBattleResultKey("Вивезли за все держ"), "successful");
});

test("визначає неуспішне БЗВ по невдало або не вдало", () => {
  assert.equal(getTruckBattleResultKey("Невдало"), "failed");
  assert.equal(getTruckBattleResultKey("Не вдало"), "failed");
  assert.equal(getTruckBattleResultKey("НЕ   ВДАЛО"), "failed");
  assert.equal(getTruckBattleResultKey("Не вивезли"), "failed");
});

test("не рахує повідомлення без зрозумілого результату БЗВ", () => {
  assert.equal(getTruckBattleResultKey("БЗВ"), null);
});

test("рахує успішні та неуспішні БЗВ для автора і згаданих користувачів", () => {
  const result = countTruckBattleParticipants([
    createMessage({
      authorId: "user-1",
      content: "Вдало <@user-2>",
      mentionedUsers: [{ id: "user-2" }, { id: "user-2" }],
    }),
    createMessage({
      authorId: "user-2",
      content: "Не вдало <@user-3>",
      mentionedUsers: [{ id: "user-3" }],
    }),
  ]);

  assert.deepEqual(result, [
    {
      userId: "user-2",
      count: {
        failed: 1,
        successful: 1,
      },
    },
    {
      userId: "user-1",
      count: {
        failed: 0,
        successful: 1,
      },
    },
    {
      userId: "user-3",
      count: {
        failed: 1,
        successful: 0,
      },
    },
  ]);
});

test("фільтрує службові повідомлення меж звітного тижня для БЗВ", () => {
  assert.equal(
    TRUCK_BATTLE_REPORT.filterMessage({
      content: "ПОЧАТОК ЗВІТУВАННЯ ЗА [02.03.2026 - 08.03.2026] ТИЖДЕНЬ.",
    }),
    false,
  );
});

function createMessage({ authorId, content, mentionedUsers = [] }) {
  return {
    author: {
      bot: false,
      id: authorId,
    },
    content,
    mentions: {
      users: {
        values: () => mentionedUsers.map((user) => ({ bot: false, ...user })).values(),
      },
    },
  };
}
