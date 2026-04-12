const assert = require("node:assert/strict");
const test = require("node:test");

const { WEEK_DAYS } = require("./days");
const { TEST_NOTIFICATION_ID, createWeeklyNotificationSchedule, normalizeWeeklySchedule } = require(".");

test("додає івенти з базового розкладу", () => {
  const schedule = createWeeklyNotificationSchedule({});
  const notifications = schedule.flatMap(({ messages }) => messages);

  assert.equal(notifications.length, 217);
  assert.equal(normalizeWeeklySchedule(schedule).length, 217);
  assert.equal(hasNotification(notifications, "hammer-war-monday-0000", WEEK_DAYS.MONDAY, "00:00"), true);
  assert.equal(hasNotification(notifications, "hammer-war-sunday-2100", WEEK_DAYS.SUNDAY, "21:00"), true);
  assert.equal(hasNotification(notifications, "truck-battle-monday-0100", WEEK_DAYS.MONDAY, "01:00"), true);
  assert.equal(hasNotification(notifications, "truck-battle-monday-1300", WEEK_DAYS.MONDAY, "13:00"), true);
  assert.equal(hasNotification(notifications, "truck-battle-tuesday-1600", WEEK_DAYS.TUESDAY, "16:00"), true);
  assert.equal(hasNotification(notifications, "truck-battle-sunday-1900", WEEK_DAYS.SUNDAY, "19:00"), true);
  assert.equal(hasNotification(notifications, "plane-crash-monday-2300", WEEK_DAYS.MONDAY, "23:00"), true);
  assert.equal(hasNotification(notifications, "plane-crash-tuesday-1400", WEEK_DAYS.TUESDAY, "14:00"), true);
  assert.equal(hasNotification(notifications, "plane-crash-friday-1700", WEEK_DAYS.FRIDAY, "17:00"), true);
  assert.equal(hasNotification(notifications, "plane-crash-sunday-2300", WEEK_DAYS.SUNDAY, "23:00"), true);
  assert.equal(hasNotification(notifications, "truck-battle-monday-1200", WEEK_DAYS.MONDAY, "12:00"), false);
  assert.equal(hasNotification(notifications, "plane-crash-tuesday-1300", WEEK_DAYS.TUESDAY, "13:00"), false);
  assert.equal(hasNotification(notifications, "hourly-1-1300", WEEK_DAYS.MONDAY, "13:00"), true);

  const hourlyNotification = notifications.find(({ id }) => id === "hourly-1-1300");

  assert.equal(hourlyNotification.leadTimeMinutes, 5);
});

test("не додає тестове сповіщення без env-прапорця", () => {
  const schedule = createWeeklyNotificationSchedule({});
  const notifications = schedule.flatMap(({ messages }) => messages);

  assert.equal(notifications.some(({ id }) => id === TEST_NOTIFICATION_ID), false);
});

test("додає тестове сповіщення з env-параметрів", () => {
  const schedule = createWeeklyNotificationSchedule({
    TEST_NOTIFICATION_ENABLED: "true",
    TEST_NOTIFICATION_DAY: String(WEEK_DAYS.SATURDAY),
    TEST_NOTIFICATION_TIME: "14:30",
    TEST_NOTIFICATION_TEXT: "Тест працює.",
  });
  const saturdaySchedule = schedule.find(({ day }) => day === WEEK_DAYS.SATURDAY);
  const testNotification = saturdaySchedule.messages.find(({ id }) => id === TEST_NOTIFICATION_ID);

  assert.ok(testNotification);
  assert.equal(testNotification.time, "14:30");
  assert.equal(testNotification.params.text, "Тест працює.");
  assert.equal(typeof testNotification.callback, "function");
});

function hasNotification(notifications, id, day, time) {
  return notifications.some(
    (notification) => notification.id === id && notification.day === day && notification.time === time,
  );
}
