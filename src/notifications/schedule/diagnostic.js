const { sendTestNotification } = require("../messages");
const { WEEK_DAYS, assertIsoWeekDay } = require("./days");
const { parseScheduleTime } = require("./time");

const TEST_NOTIFICATION_ID = "test-notification";
const TEST_NOTIFICATION_DEFAULT_DAY = WEEK_DAYS.SUNDAY;
const TEST_NOTIFICATION_DEFAULT_TIME = "18:00";
const TEST_NOTIFICATION_DEFAULT_TEXT = "Бот успішно відправив тестове сповіщення.";

function createTestNotification(env = process.env) {
  if (!isTestNotificationEnabled(env.TEST_NOTIFICATION_ENABLED)) {
    return null;
  }

  const day = parseNotificationDay(env.TEST_NOTIFICATION_DAY || TEST_NOTIFICATION_DEFAULT_DAY);
  const time = env.TEST_NOTIFICATION_TIME || TEST_NOTIFICATION_DEFAULT_TIME;

  parseScheduleTime(time);

  return {
    id: TEST_NOTIFICATION_ID,
    day,
    time,
    params: Object.freeze({
      text: env.TEST_NOTIFICATION_TEXT || TEST_NOTIFICATION_DEFAULT_TEXT,
      time,
    }),
    callback: sendTestNotification,
  };
}

function isTestNotificationEnabled(value) {
  return value === "true" || value === "1";
}

function parseNotificationDay(day) {
  const parsedDay = Number(day);

  assertIsoWeekDay(parsedDay);

  return parsedDay;
}

module.exports = {
  TEST_NOTIFICATION_ID,
  createTestNotification,
};
