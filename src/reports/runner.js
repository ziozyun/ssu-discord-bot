const { getCurrentReportPeriod } = require("./period");
const { fetchReportMessages } = require("./messages");

async function collectReport({
  client,
  report,
  now = () => new Date(),
  logger = console,
} = {}) {
  if (!report?.id) {
    throw new Error("report має містити id.");
  }

  if (!Array.isArray(report.channelIds) || !report.channelIds.length) {
    throw new Error(`report ${report.id} має містити channelIds.`);
  }

  const period = getCurrentReportPeriod(now());
  const messages = await fetchReportMessages({
    client,
    channelIds: report.channelIds,
    period,
    logger,
  });
  const filteredMessages = typeof report.filterMessage === "function"
    ? messages.filter((message) => report.filterMessage(message, { period }))
    : messages;
  const result = typeof report.buildResult === "function"
    ? await report.buildResult(filteredMessages, { period, logger })
    : filteredMessages;

  return Object.freeze({
    reportId: report.id,
    period,
    messages: filteredMessages,
    result,
  });
}

module.exports = {
  collectReport,
};
