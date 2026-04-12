const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const VRU_REPORT_ID = "Участь у ВРУ";

const VRU_REPORT = Object.freeze({
  id: VRU_REPORT_ID,
  channelIds: getVruChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getVruChannelIds() {
  return (process.env.REPORT_VRU_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  VRU_REPORT,
  VRU_REPORT_ID,
  getVruChannelIds,
};
