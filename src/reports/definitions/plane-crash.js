const { getMessageContent, shouldIgnoreReportMessage } = require("../common");
const { getMessageParticipantIds } = require("../participants");

const PLANE_CRASH_REPORT_ID = "Крах літака";

const PLANE_CRASH_REPORT = Object.freeze({
  id: PLANE_CRASH_REPORT_ID,
  channelIds: getPlaneCrashChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countPlaneCrashParticipants(messages),
  }),
});

function countPlaneCrashParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    const boxCount = extractPlaneCrashBoxCount(getMessageContent(message));

    for (const userId of getMessageParticipantIds(message)) {
      incrementPlaneCrashCount(counts, userId, boxCount);
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((left, right) => getTotalCount(right.count) - getTotalCount(left.count) || left.userId.localeCompare(right.userId));
}

function extractPlaneCrashBoxCount(content) {
  const text = String(content || "");

  const matches = [...text.matchAll(/(?:№\s*\**\s*(\d+)\**)|(\d+)/g)];

  for (const match of matches) {
    const numberAfterNo = match[1];
    const normalNumber = match[2];

    if (!numberAfterNo && normalNumber) {
      return Number(normalNumber);
    }
  }

  return 0;
}

function incrementPlaneCrashCount(counts, userId, boxCount) {
  const count = counts.get(userId) || { boxes: 0, participation: 0 };

  count.boxes += boxCount;
  count.participation += 1;
  counts.set(userId, count);
}

function getTotalCount(count) {
  return count.boxes + count.participation;
}

function getPlaneCrashChannelIds() {
  return (process.env.REPORT_PLANE_CRASH_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  PLANE_CRASH_REPORT,
  PLANE_CRASH_REPORT_ID,
  countPlaneCrashParticipants,
  extractPlaneCrashBoxCount,
  getPlaneCrashChannelIds,
};
