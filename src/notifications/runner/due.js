const { getIsoWeekDay } = require("../schedule/days");
const { parseScheduleTime } = require("../schedule");

const MINUTE_IN_MS = 60 * 1000;

function findDueNotifications(
  notifications,
  currentDate,
  leadTimeMinutes,
  dispatchedNotificationKeys = new Map(),
  missedNotificationLookbackMs = 0,
) {
  return notifications
    .map((notification) =>
      getDueNotification(notification, currentDate, leadTimeMinutes, missedNotificationLookbackMs),
    )
    .filter((notification) => notification && !dispatchedNotificationKeys.has(notification.dispatchKey));
}

function getDueNotification(notification, currentDate, leadTimeMinutes, missedNotificationLookbackMs = 0) {
  const currentMinute = floorToMinute(currentDate).getTime();
  const earliestNotifyAt = currentMinute - missedNotificationLookbackMs;
  const notificationLeadTimeMinutes = notification.leadTimeMinutes ?? leadTimeMinutes;

  for (const weekOffset of [0, 1]) {
    const scheduledAt = getDateForScheduleEntry(currentDate, notification, weekOffset);
    const notifyAt = new Date(scheduledAt.getTime() - notificationLeadTimeMinutes * MINUTE_IN_MS);
    const notifyAtTime = notifyAt.getTime();
    const scheduledAtTime = scheduledAt.getTime();
    const isRecentMiss = notifyAtTime >= earliestNotifyAt && notifyAtTime <= currentMinute;
    const isMissedButBeforeEvent = notifyAtTime <= currentMinute && currentMinute < scheduledAtTime;

    if (!isRecentMiss && !isMissedButBeforeEvent) {
      continue;
    }

    return Object.freeze({
      ...notification,
      scheduledAt,
      notifyAt,
      dispatchKey: `${notification.id}:${notifyAt.toISOString()}`,
    });
  }

  return null;
}

function getDateForScheduleEntry(referenceDate, notification, weekOffset) {
  const { hours, minutes } = parseScheduleTime(notification.time);
  const scheduledAt = getStartOfIsoWeek(referenceDate);

  scheduledAt.setDate(scheduledAt.getDate() + notification.day - 1 + weekOffset * 7);
  scheduledAt.setHours(hours, minutes, 0, 0);

  return scheduledAt;
}

function getStartOfIsoWeek(date) {
  const weekStart = new Date(date);

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - getIsoWeekDay(weekStart) + 1);

  return weekStart;
}

function floorToMinute(date) {
  const flooredDate = new Date(date);

  flooredDate.setSeconds(0, 0);

  return flooredDate;
}

module.exports = {
  findDueNotifications,
  getDueNotification,
};
