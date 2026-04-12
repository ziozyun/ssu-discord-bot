const { sendTestNotification } = require("./diagnostic");
const {
  addMinutesToScheduleTime,
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTruckBattleNotification,
} = require("./events");
const { sendHourlyNotification } = require("./hourly");
const { logUnconfiguredNotification } = require("./logging");

module.exports = {
  addMinutesToScheduleTime,
  logUnconfiguredNotification,
  sendHammerWarNotification,
  sendHourlyNotification,
  sendPlaneCrashNotification,
  sendTestNotification,
  sendTruckBattleNotification,
};
