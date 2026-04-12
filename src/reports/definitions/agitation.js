const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const AGITATION_REPORT_ID = "Агітація громадян";

const AGITATION_REPORT = Object.freeze({
  id: AGITATION_REPORT_ID,
  channelIds: getAgitationChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getAgitationChannelIds() {
  return (process.env.REPORT_AGITATION_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  AGITATION_REPORT,
  AGITATION_REPORT_ID,
  getAgitationChannelIds,
};
