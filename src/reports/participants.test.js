const assert = require("node:assert/strict");
const test = require("node:test");

const { countMessageParticipants, getMessageParticipantIds } = require("./participants");

test("рахує автора і згаданих користувачів у повідомленні", () => {
  const participantIds = getMessageParticipantIds(
    createMessage({
      authorId: "user-1",
      mentionedUsers: [{ id: "user-2" }, { id: "user-3" }],
    }),
  );

  assert.deepEqual(participantIds, ["user-1", "user-2", "user-3"]);
});

test("не дублює автора, якщо його згадали в тому ж повідомленні", () => {
  const participantIds = getMessageParticipantIds(
    createMessage({
      authorId: "user-1",
      mentionedUsers: [{ id: "user-1" }, { id: "user-2" }],
    }),
  );

  assert.deepEqual(participantIds, ["user-1", "user-2"]);
});

test("рахує участі користувачів у списку повідомлень", () => {
  const counts = countMessageParticipants([
    createMessage({ authorId: "user-1", mentionedUsers: [{ id: "user-2" }] }),
    createMessage({ authorId: "user-2", mentionedUsers: [{ id: "user-3" }] }),
  ]);

  assert.deepEqual(counts, [
    { count: 2, userId: "user-2" },
    { count: 1, userId: "user-1" },
    { count: 1, userId: "user-3" },
  ]);
});

function createMessage({ authorId, mentionedUsers = [] }) {
  return {
    author: {
      bot: false,
      id: authorId,
    },
    mentions: {
      users: new Map(mentionedUsers.map((user) => [user.id, { bot: false, ...user }])),
    },
  };
}
