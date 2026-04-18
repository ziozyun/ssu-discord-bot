const { getMessageContent, shouldIgnoreReportMessage } = require("../common");
const { getMessageParticipantIds } = require("../participants");

const DUTY_REPORT_ID = "Чергування";

const DUTY_REPORT = Object.freeze({
  id: DUTY_REPORT_ID,
  channelIds: getDutyChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: async (messages) => ({
    participants: await countDutyParticipants(messages),
  }),
});

async function countDutyParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    const content = getMessageContent(message);
    const hours = extractDutyHours(content);

    const participantIds = await getMessageParticipantIds(message);

    for (const userId of participantIds) {
      incrementDutyCount(counts, userId, hours);
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((a, b) => b.count - a.count);
}

function extractDutyHours(content) {
  const text = String(content || "");

  const startMatch = text.match(
    /Початок:\s*(\d{2}\.\d{2}\.\d{4})[, ]+\s*(\d{2}:\d{2})/i
  );

  const endMatch = text.match(
    /Кінець:\s*(\d{2}\.\d{2}\.\d{4})[, ]+\s*(\d{2}:\d{2})/i
  );

  if (!startMatch || !endMatch) return 0;

  const start = parseDate(startMatch[1], startMatch[2]);
  const end = parseDate(endMatch[1], endMatch[2]);

  if (!start || !end) return 0;

  const diffMinutes = (end - start) / (1000 * 60);
  if (diffMinutes <= 0) return 0;

  // округлення: 10+ хв = +1 година
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

function incrementDutyCount(counts, userId, hours) {
  const current = counts.get(userId) || 0;
  counts.set(userId, current + hours);
}

function getDutyChannelIds() {
  return (process.env.REPORT_DUTY_CHANNEL_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

module.exports = {
  DUTY_REPORT,
  DUTY_REPORT_ID,
  countDutyParticipants,
  extractDutyHours,
  getDutyChannelIds,
};
