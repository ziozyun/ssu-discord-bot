const { getMessageContent, shouldIgnoreReportMessage } = require("../common");
const { getMessageParticipantIds } = require("../participants");
const { getStatusResultKey } = require("./status-result");

function createStatusReport({
  channelIds,
  id,
}) {
  return Object.freeze({
    id,
    channelIds,
    filterMessage: (message) => !shouldIgnoreReportMessage(message),
    buildResult: (messages) => ({
      participants: countStatusParticipants(messages),
    }),
  });
}

function countStatusParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    const resultKey = getStatusResultKey(getMessageContent(message));

    if (!resultKey) {
      continue;
    }

    for (const userId of getMessageParticipantIds(message)) {
      incrementStatusCount(counts, userId, resultKey);
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((left, right) => getTotalCount(right.count) - getTotalCount(left.count) || left.userId.localeCompare(right.userId));
}

function incrementStatusCount(counts, userId, key) {
  const count = counts.get(userId) || { failed: 0, successful: 0 };

  count[key] += 1;
  counts.set(userId, count);
}

function getTotalCount(count) {
  return count.failed + count.successful;
}

module.exports = {
  countStatusParticipants,
  createStatusReport,
};
