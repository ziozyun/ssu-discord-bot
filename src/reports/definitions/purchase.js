const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const PURCHASE_REPORT_ID = "Контрольна закупка";

const PURCHASE_REPORT = Object.freeze({
  id: PURCHASE_REPORT_ID,
  channelIds: getPurchaseChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getPurchaseChannelIds() {
  return (process.env.REPORT_PURCHASE_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  PURCHASE_REPORT,
  PURCHASE_REPORT_ID,
  getPurchaseChannelIds,
};
