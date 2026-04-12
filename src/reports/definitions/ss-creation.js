const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const SS_CREATION_REPORT_ID = "Створення СС-ки";

const SS_CREATION_REPORT = Object.freeze({
  id: SS_CREATION_REPORT_ID,
  channelIds: getSsCreationChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getSsCreationChannelIds() {
  return (process.env.REPORT_SS_CREATION_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  SS_CREATION_REPORT,
  SS_CREATION_REPORT_ID,
  getSsCreationChannelIds,
};
