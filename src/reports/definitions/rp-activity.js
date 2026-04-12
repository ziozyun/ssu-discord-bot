const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const RP_ACTIVITY_REPORT_ID = "РП активність";

const RP_ACTIVITY_REPORT = Object.freeze({
  id: RP_ACTIVITY_REPORT_ID,
  channelIds: getRpActivityChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getRpActivityChannelIds() {
  return (process.env.REPORT_RP_ACTIVITY_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  RP_ACTIVITY_REPORT,
  RP_ACTIVITY_REPORT_ID,
  getRpActivityChannelIds,
};
