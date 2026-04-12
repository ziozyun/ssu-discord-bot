const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const SEARCH_REPORT_ID = "Обшук";

const SEARCH_REPORT = Object.freeze({
  id: SEARCH_REPORT_ID,
  channelIds: getSearchChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getSearchChannelIds() {
  return (process.env.REPORT_SEARCH_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  SEARCH_REPORT,
  SEARCH_REPORT_ID,
  getSearchChannelIds,
};
