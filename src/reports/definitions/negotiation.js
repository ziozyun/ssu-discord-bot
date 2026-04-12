const { shouldIgnoreReportMessage } = require("../common");

const NEGOTIATION_REPORT_ID = "Перемовини";

const NEGOTIATION_REPORT = Object.freeze({
  id: NEGOTIATION_REPORT_ID,
  channelIds: getNegotiationChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countNegotiationParticipants(messages),
  }),
});

function countNegotiationParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    if (message?.author?.id && !message.author.bot) {
      incrementNegotiationCount(counts, message.author.id, "conducted");
    }

    for (const userId of getMentionedUserIds(message)) {
      if (userId === message?.author?.id) {
        continue;
      }

      incrementNegotiationCount(counts, userId, "controlled");
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((left, right) => getTotalCount(right.count) - getTotalCount(left.count) || left.userId.localeCompare(right.userId));
}

function incrementNegotiationCount(counts, userId, key) {
  const count = counts.get(userId) || { conducted: 0, controlled: 0 };

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
  return count.conducted + count.controlled;
}

function getNegotiationChannelIds() {
  return (process.env.REPORT_NEGOTIATION_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  NEGOTIATION_REPORT,
  NEGOTIATION_REPORT_ID,
  countNegotiationParticipants,
  getNegotiationChannelIds,
};
