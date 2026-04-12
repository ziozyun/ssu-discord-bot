const { shouldIgnoreReportMessage } = require("../common");

const INTERROGATION_REPORT_ID = "Допит";

const INTERROGATION_REPORT = Object.freeze({
  id: INTERROGATION_REPORT_ID,
  channelIds: getInterrogationChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countInterrogationParticipants(messages),
  }),
});

function countInterrogationParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    if (message?.author?.id && !message.author.bot) {
      incrementInterrogationCount(counts, message.author.id, "conducted");
    }

    for (const userId of getMentionedUserIds(message)) {
      if (userId === message?.author?.id) {
        continue;
      }

      incrementInterrogationCount(counts, userId, "participated");
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((left, right) => getTotalCount(right.count) - getTotalCount(left.count) || left.userId.localeCompare(right.userId));
}

function incrementInterrogationCount(counts, userId, key) {
  const count = counts.get(userId) || { conducted: 0, participated: 0 };

  count[key] += 1;
  counts.set(userId, count);
}

function getMentionedUserIds(message) {
  let userIds = [];

  if (message?.mentions?.users?.values) {
    userIds = Array.from(message.mentions.users.values())
      .filter((user) => !user.bot)
      .map((user) => user.id);
  } else if (message?.mentions?.users instanceof Map) {
    userIds = Array.from(message.mentions.users.values())
      .filter((user) => !user.bot)
      .map((user) => user.id);
  }

  return Array.from(new Set(userIds));
}

function getTotalCount(count) {
  return count.conducted + count.participated;
}

function getInterrogationChannelIds() {
  return (process.env.REPORT_INTERROGATION_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  INTERROGATION_REPORT,
  INTERROGATION_REPORT_ID,
  countInterrogationParticipants,
  getInterrogationChannelIds,
};
