const { getMessageContent, shouldIgnoreReportMessage } = require("../common");
const { getMessageParticipantIds } = require("../participants");

const PATROL_REPORT_ID = "Патруль";

const PATROL_REPORT = Object.freeze({
  id: PATROL_REPORT_ID,
  channelIds: getPatrolChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countPatrolParticipants(messages),
  }),
});

function countPatrolParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    const content = getMessageContent(message);

    const hours = extractPatrolHours(content);

    const participantIds = getMessageParticipantIds(message);

    for (const userId of participantIds) {
      incrementPatrolCount(counts, userId, hours);

      console.log(
        "[PATROL] updated",
        userId,
        "=>",
        counts.get(userId)
      );
    }
  }

  const result = Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((a, b) => b.count - a.count);

  return result;
}

function extractPatrolHours(content) {
  const text = String(content || "");

  // Гнучкий regex під Discord формат
  const startMatch = text.match(
    /Початок:\s*(\d{2}\.\d{2}\.\d{4})[, ]+\s*(\d{2}:\d{2})/i
  );

  const endMatch = text.match(
    /Кінець:\s*(\d{2}\.\d{2}\.\d{4})[, ]+\s*(\d{2}:\d{2})/i
  );

  if (!startMatch || !endMatch) {
    return 0;
  }

  const start = parseDate(startMatch[1], startMatch[2]);
  const end = parseDate(endMatch[1], endMatch[2]);

  if (!start || !end) {
    console.log("[PATROL] ❌ invalid date");
    return 0;
  }

  const diffMinutes = (end - start) / (1000 * 60);

  console.log("[PATROL] diffMinutes =", diffMinutes);

  if (diffMinutes <= 0) return 0;

  // 🔥 округлення: 10+ хв = +1 година
  const hours = Math.floor(diffMinutes / 60);
  const remainder = diffMinutes % 60;

  return hours + (remainder >= 10 ? 1 : 0);
}

function parseDate(datePart, timePart) {
  const [day, month, year] = datePart.split(".");
  const [hours, minutes] = timePart.split(":");

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  );
}

function incrementPatrolCount(counts, userId, hours) {
  const current = counts.get(userId) || 0;
  counts.set(userId, current + hours);
}

function getPatrolChannelIds() {
  return (process.env.REPORT_PATROL_CHANNEL_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

module.exports = {
  PATROL_REPORT,
  PATROL_REPORT_ID,
  countPatrolParticipants,
  extractPatrolHours,
  getPatrolChannelIds,
};
