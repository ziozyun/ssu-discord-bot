const { shouldIgnoreReportMessage } = require("../common");
const { countMessageParticipants } = require("../participants");

const AIRCRAFT_CARRIER_DEFENSE_REPORT_ID = "ФЗ/ЗАХИСТ АВІАНОСЦЯ";

const AIRCRAFT_CARRIER_DEFENSE_REPORT = Object.freeze({
  id: AIRCRAFT_CARRIER_DEFENSE_REPORT_ID,
  channelIds: getAircraftCarrierDefenseChannelIds(),
  filterMessage: (message) => !shouldIgnoreReportMessage(message),
  buildResult: (messages) => ({
    participants: countMessageParticipants(messages),
  }),
});

function getAircraftCarrierDefenseChannelIds() {
  return (process.env.REPORT_AIRCRAFT_CARRIER_DEFENSE_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  AIRCRAFT_CARRIER_DEFENSE_REPORT,
  AIRCRAFT_CARRIER_DEFENSE_REPORT_ID,
  getAircraftCarrierDefenseChannelIds,
};
