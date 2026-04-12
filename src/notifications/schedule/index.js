const { createTestNotification, TEST_NOTIFICATION_ID } = require("./diagnostic");
const { WEEK_DAYS } = require("./days");
const { EVENT_NOTIFICATION_DEFINITIONS } = require("./events");
const { normalizeWeeklySchedule: normalizeSchedule } = require("./normalize");
const { parseScheduleTime } = require("./time");

const NOTIFICATION_LEAD_TIME_MINUTES = 20;

const WEEKLY_NOTIFICATION_SCHEDULE = createWeeklyNotificationSchedule();

function createWeeklyNotificationSchedule(env = process.env) {
  const schedule = [
    { day: WEEK_DAYS.MONDAY, messages: [] },
    { day: WEEK_DAYS.TUESDAY, messages: [] },
    { day: WEEK_DAYS.WEDNESDAY, messages: [] },
    { day: WEEK_DAYS.THURSDAY, messages: [] },
    { day: WEEK_DAYS.FRIDAY, messages: [] },
    { day: WEEK_DAYS.SATURDAY, messages: [] },
    { day: WEEK_DAYS.SUNDAY, messages: [] },
  ];

  addEventNotifications(schedule);

  const testNotification = createTestNotification(env);

  if (testNotification) {
    const daySchedule = schedule.find(({ day }) => day === testNotification.day);
    daySchedule.messages.push(testNotification);
  }

  return Object.freeze(
    schedule.map(({ day, messages }) =>
      Object.freeze({
        day,
        messages: Object.freeze(
          [...messages].sort(compareScheduleMessages).map((message) => Object.freeze(message)),
        ),
      }),
    ),
  );
}

function addEventNotifications(schedule) {
  for (const notification of EVENT_NOTIFICATION_DEFINITIONS) {
    const daySchedule = schedule.find(({ day }) => day === notification.day);
    daySchedule.messages.push(notification);
  }
}

function compareScheduleMessages(firstMessage, secondMessage) {
  const timeComparison = firstMessage.time.localeCompare(secondMessage.time);

  if (timeComparison !== 0) {
    return timeComparison;
  }

  return firstMessage.id.localeCompare(secondMessage.id);
}

function normalizeWeeklySchedule(schedule = WEEKLY_NOTIFICATION_SCHEDULE) {
  return normalizeSchedule(schedule);
}

module.exports = {
  NOTIFICATION_LEAD_TIME_MINUTES,
  TEST_NOTIFICATION_ID,
  WEEKLY_NOTIFICATION_SCHEDULE,
  createTestNotification,
  createWeeklyNotificationSchedule,
  normalizeWeeklySchedule,
  parseScheduleTime,
};
