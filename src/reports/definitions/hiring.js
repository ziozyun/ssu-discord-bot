const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const HIRING_REPORT_ID = "Прийняття працівника";

const HIRING_REPORT = Object.freeze({
  id: HIRING_REPORT_ID,
  channelIds: getHiringChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: async (messages) => ({
    participants: await countMessageParticipants(messages),
  }),
});

function getHiringChannelIds() {
  return (process.env.REPORT_HIRING_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  HIRING_REPORT,
  HIRING_REPORT_ID,
  getHiringChannelIds,
};
