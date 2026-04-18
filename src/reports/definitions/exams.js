const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const EXAMS_REPORT_ID = "Проведення іспитів";

const EXAMS_REPORT = Object.freeze({
  id: EXAMS_REPORT_ID,
  channelIds: getExamsChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: async (messages) => ({
    participants: await countMessageParticipants(messages),
  }),
});

function getExamsChannelIds() {
  return (process.env.REPORT_EXAMS_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  EXAMS_REPORT,
  EXAMS_REPORT_ID,
  getExamsChannelIds,
};
