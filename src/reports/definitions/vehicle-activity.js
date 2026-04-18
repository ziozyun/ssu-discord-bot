const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const VEHICLE_ACTIVITY_REPORT_ID = "Угонка/SOTW/Фургон";

const VEHICLE_ACTIVITY_REPORT = Object.freeze({
  id: VEHICLE_ACTIVITY_REPORT_ID,
  channelIds: getVehicleActivityChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: async (messages) => ({
    participants: await countMessageParticipants(messages),
  }),
});

function getVehicleActivityChannelIds() {
  return (process.env.REPORT_VEHICLE_ACTIVITY_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  VEHICLE_ACTIVITY_REPORT,
  VEHICLE_ACTIVITY_REPORT_ID,
  getVehicleActivityChannelIds,
};
