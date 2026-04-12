const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const ARREST_REPORT_ID = "Арешт";

const ARREST_REPORT = Object.freeze({
  id: ARREST_REPORT_ID,
  channelIds: getArrestChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getArrestChannelIds() {
  return (process.env.REPORT_ARREST_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  ARREST_REPORT,
  ARREST_REPORT_ID,
  getArrestChannelIds,
};
