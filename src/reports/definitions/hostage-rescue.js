const { createStatusReport } = require("./status-count");

const HOSTAGE_RESCUE_REPORT_ID = "ВЗХ";

const HOSTAGE_RESCUE_REPORT = createStatusReport({
  id: HOSTAGE_RESCUE_REPORT_ID,
  channelIds: getHostageRescueChannelIds(),
});

function getHostageRescueChannelIds() {
  return (process.env.REPORT_HOSTAGE_RESCUE_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  HOSTAGE_RESCUE_REPORT,
  HOSTAGE_RESCUE_REPORT_ID,
  getHostageRescueChannelIds,
};
