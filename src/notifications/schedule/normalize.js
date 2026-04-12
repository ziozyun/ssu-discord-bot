const { assertIsoWeekDay } = require("./days");
const { parseScheduleTime } = require("./time");

function normalizeWeeklySchedule(schedule) {
  if (!Array.isArray(schedule)) {
    throw new Error("Розклад сповіщень має бути масивом.");
  }

  const notificationIds = new Set();
  const notifications = [];

  for (const daySchedule of schedule) {
    if (!daySchedule || typeof daySchedule !== "object") {
      throw new Error("День у розкладі сповіщень має бути об'єктом.");
    }

    const { day, messages = [] } = daySchedule;
    assertIsoWeekDay(day);

    if (!Array.isArray(messages)) {
      throw new Error(`Повідомлення для дня ${day} мають бути масивом.`);
    }

    for (const message of messages) {
      const notification = normalizeScheduleMessage(day, message);

      if (notificationIds.has(notification.id)) {
        throw new Error(`Дубльований id сповіщення: ${notification.id}`);
      }

      notificationIds.add(notification.id);
      notifications.push(notification);
    }
  }

  return notifications;
}

function normalizeScheduleMessage(day, message) {
  if (!message || typeof message !== "object") {
    throw new Error(`Повідомлення для дня ${day} має бути об'єктом.`);
  }

  const { id, time, params = {}, callback, leadTimeMinutes } = message;

  if (!id || typeof id !== "string") {
    throw new Error(`Повідомлення для дня ${day} має мати string id.`);
  }

  parseScheduleTime(time);

  if (params === null || typeof params !== "object" || Array.isArray(params)) {
    throw new Error(`params для ${id} має бути об'єктом.`);
  }

  if (callback !== undefined && typeof callback !== "function") {
    throw new Error(`callback для ${id} має бути функцією.`);
  }

  if (leadTimeMinutes !== undefined && (!Number.isInteger(leadTimeMinutes) || leadTimeMinutes < 0)) {
    throw new Error(`leadTimeMinutes для ${id} має бути невід'ємним цілим числом.`);
  }

  return Object.freeze({
    id,
    day,
    time,
    params: Object.freeze({ ...params }),
    callback,
    leadTimeMinutes,
  });
}

module.exports = {
  normalizeWeeklySchedule,
};
