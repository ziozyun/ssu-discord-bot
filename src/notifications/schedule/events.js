const {
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTruckBattleNotification,
} = require("../messages");
const { WEEK_DAYS } = require("./days");

const WEEK_DAY_SLUGS = Object.freeze({
  [WEEK_DAYS.MONDAY]: "monday",
  [WEEK_DAYS.TUESDAY]: "tuesday",
  [WEEK_DAYS.WEDNESDAY]: "wednesday",
  [WEEK_DAYS.THURSDAY]: "thursday",
  [WEEK_DAYS.FRIDAY]: "friday",
  [WEEK_DAYS.SATURDAY]: "saturday",
  [WEEK_DAYS.SUNDAY]: "sunday",
});
const ALL_WEEK_DAYS = Object.freeze([
  WEEK_DAYS.MONDAY,
  WEEK_DAYS.TUESDAY,
  WEEK_DAYS.WEDNESDAY,
  WEEK_DAYS.THURSDAY,
  WEEK_DAYS.FRIDAY,
  WEEK_DAYS.SATURDAY,
  WEEK_DAYS.SUNDAY,
]);
const MONDAY_WEDNESDAY_FRIDAY_SUNDAY = Object.freeze([
  WEEK_DAYS.MONDAY,
  WEEK_DAYS.WEDNESDAY,
  WEEK_DAYS.FRIDAY,
  WEEK_DAYS.SUNDAY,
]);
const TUESDAY_THURSDAY_SATURDAY = Object.freeze([
  WEEK_DAYS.TUESDAY,
  WEEK_DAYS.THURSDAY,
  WEEK_DAYS.SATURDAY,
]);

const EVENT_NOTIFICATION_DEFINITIONS = Object.freeze([
  ...createDefinitions("hammer-war", ALL_WEEK_DAYS, ["00:00", "21:00"], sendHammerWarNotification),
  ...createDefinitions("truck-battle", ALL_WEEK_DAYS, ["01:00"], sendTruckBattleNotification),
  ...createDefinitions(
    "truck-battle",
    MONDAY_WEDNESDAY_FRIDAY_SUNDAY,
    ["13:00", "19:00"],
    sendTruckBattleNotification,
  ),
  ...createDefinitions(
    "truck-battle",
    TUESDAY_THURSDAY_SATURDAY,
    ["16:00", "20:00"],
    sendTruckBattleNotification,
  ),
  ...createDefinitions("plane-crash", ALL_WEEK_DAYS, ["23:00"], sendPlaneCrashNotification),
  ...createDefinitions(
    "plane-crash",
    MONDAY_WEDNESDAY_FRIDAY_SUNDAY,
    ["17:00"],
    sendPlaneCrashNotification,
  ),
  ...createDefinitions(
    "plane-crash",
    TUESDAY_THURSDAY_SATURDAY,
    ["14:00"],
    sendPlaneCrashNotification,
  ),
]);

function createDefinitions(eventId, days, times, callback) {
  return days.flatMap((day) =>
    times.map((time) =>
      Object.freeze({
        id: `${eventId}-${WEEK_DAY_SLUGS[day]}-${time.replace(":", "")}`,
        day,
        time,
        params: Object.freeze({ time }),
        callback,
      }),
    ),
  );
}

module.exports = {
  EVENT_NOTIFICATION_DEFINITIONS,
};
