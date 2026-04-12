const { sendHourlyNotification } = require("../messages");
const { WEEK_DAYS } = require("./days");

const HOURLY_NOTIFICATION_LEAD_TIME_MINUTES = 5;
const ALL_WEEK_DAYS = Object.freeze([
  WEEK_DAYS.MONDAY,
  WEEK_DAYS.TUESDAY,
  WEEK_DAYS.WEDNESDAY,
  WEEK_DAYS.THURSDAY,
  WEEK_DAYS.FRIDAY,
  WEEK_DAYS.SATURDAY,
  WEEK_DAYS.SUNDAY,
]);

const HOURLY_NOTIFICATION_DEFINITIONS = Object.freeze(
  ALL_WEEK_DAYS.flatMap((day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const time = `${String(hour).padStart(2, "0")}:00`;

      return Object.freeze({
        id: `hourly-${day}-${String(hour).padStart(2, "0")}00`,
        day,
        time,
        leadTimeMinutes: HOURLY_NOTIFICATION_LEAD_TIME_MINUTES,
        params: Object.freeze({ time }),
        callback: sendHourlyNotification,
      });
    }),
  ),
);

module.exports = {
  HOURLY_NOTIFICATION_DEFINITIONS,
  HOURLY_NOTIFICATION_LEAD_TIME_MINUTES,
};
