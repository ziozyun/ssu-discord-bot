const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const RAID_REPORT_ID = "Рейд";

const RAID_REPORT = Object.freeze({
  id: RAID_REPORT_ID,
  channelIds: getRaidChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getRaidChannelIds() {
  return (process.env.REPORT_RAID_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  RAID_REPORT,
  RAID_REPORT_ID,
  getRaidChannelIds,
};
