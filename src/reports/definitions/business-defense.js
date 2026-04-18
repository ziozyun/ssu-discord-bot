const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const BUSINESS_DEFENSE_REPORT_ID = "Відбиття бізнесу";

const BUSINESS_DEFENSE_REPORT = Object.freeze({
  id: BUSINESS_DEFENSE_REPORT_ID,
  channelIds: getBusinessDefenseChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: async (messages) => ({
    participants: await countMessageParticipants(messages),
  }),
});

function getBusinessDefenseChannelIds() {
  return (process.env.REPORT_BUSINESS_DEFENSE_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  BUSINESS_DEFENSE_REPORT,
  BUSINESS_DEFENSE_REPORT_ID,
  getBusinessDefenseChannelIds,
};
