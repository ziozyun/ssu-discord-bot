const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const SUPPLY_REPORT_ID = "ПОСТАЧАННЯ";

const SUPPLY_REPORT = Object.freeze({
  id: SUPPLY_REPORT_ID,
  channelIds: getSupplyChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getSupplyChannelIds() {
  return (process.env.REPORT_SUPPLY_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  SUPPLY_REPORT,
  SUPPLY_REPORT_ID,
  getSupplyChannelIds,
};
