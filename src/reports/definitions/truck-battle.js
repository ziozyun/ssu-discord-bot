const { countStatusParticipants, createStatusReport } = require("./status-count");
const { getStatusResultKey } = require("./status-result");

const TRUCK_BATTLE_REPORT_ID = "БЗВ";

const TRUCK_BATTLE_REPORT = createStatusReport({
  id: TRUCK_BATTLE_REPORT_ID,
  channelIds: getTruckBattleChannelIds(),
});

const countTruckBattleParticipants = countStatusParticipants;
const getTruckBattleResultKey = getStatusResultKey;

function getTruckBattleChannelIds() {
  return (process.env.REPORT_TRUCK_BATTLE_CHANNEL_IDS || "")
    .split(",")
    .map((channelId) => channelId.trim())
    .filter(Boolean);
}

module.exports = {
  TRUCK_BATTLE_REPORT,
  TRUCK_BATTLE_REPORT_ID,
  countTruckBattleParticipants,
  getTruckBattleChannelIds,
  getTruckBattleResultKey,
};
