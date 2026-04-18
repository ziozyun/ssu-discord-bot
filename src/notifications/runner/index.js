const { createLogger } = require("../../logger");
const {
  NOTIFICATION_LEAD_TIME_MINUTES,
  normalizeWeeklySchedule,
} = require("../schedule");
const { pruneDispatchCache } = require("./cache");
const { dispatchNotification } = require("./dispatch");
const { findDueNotifications, getDueNotification } = require("./due");
const { createDispatchCacheStore } = require("./store");

const DEFAULT_TICK_INTERVAL_MS = 10 * 1000;
const DEFAULT_MISSED_NOTIFICATION_LOOKBACK_MS = 2 * 60 * 1000;
const DEFAULT_LOGGER = createLogger("notifications");

function createNotificationRunner({
  schedule,
  leadTimeMinutes = NOTIFICATION_LEAD_TIME_MINUTES,
  tickIntervalMs = DEFAULT_TICK_INTERVAL_MS,
  missedNotificationLookbackMs = DEFAULT_MISSED_NOTIFICATION_LOOKBACK_MS,
  onNotification,
  context = {},
  dispatchCacheStore = createDispatchCacheStore(),
  logger = DEFAULT_LOGGER,
  now = () => new Date(),
} = {}) {
  if (!Number.isInteger(leadTimeMinutes) || leadTimeMinutes < 0) {
    throw new Error("leadTimeMinutes має бути невід'ємним цілим числом.");
  }

  if (!Number.isInteger(tickIntervalMs) || tickIntervalMs <= 0) {
    throw new Error("tickIntervalMs має бути додатнім цілим числом.");
  }

  if (!Number.isInteger(missedNotificationLookbackMs) || missedNotificationLookbackMs < 0) {
    throw new Error("missedNotificationLookbackMs має бути невід'ємним цілим числом.");
  }

  if (typeof onNotification !== "function") {
    throw new Error("onNotification має бути функцією.");
  }

  if (typeof now !== "function") {
    throw new Error("now має бути функцією.");
  }

  const notifications = normalizeWeeklySchedule(schedule);
  const dispatchedNotificationKeys = new Map();
  const inFlightNotificationKeys = new Set();
  const dispatchCacheReady = loadDispatchCache();
  let timer = null;

  async function tick(currentDate = now()) {
    await dispatchCacheReady;

    const dueNotifications = findDueNotifications(
      notifications,
      currentDate,
      leadTimeMinutes,
      dispatchedNotificationKeys,
      missedNotificationLookbackMs,
    ).filter((notification) => !inFlightNotificationKeys.has(notification.dispatchKey));

    for (const notification of dueNotifications) {
      inFlightNotificationKeys.add(notification.dispatchKey);

      try {
        const wasDispatched = await dispatchNotification(notification, onNotification, logger, context);

        if (wasDispatched) {
          dispatchedNotificationKeys.set(notification.dispatchKey, currentDate.getTime());
          await dispatchCacheStore.writeCache(dispatchedNotificationKeys);
        }
      } finally {
        inFlightNotificationKeys.delete(notification.dispatchKey);
      }
    }

    if (pruneDispatchCache(dispatchedNotificationKeys)) {
      await dispatchCacheStore.writeCache(dispatchedNotificationKeys);
    }

    return dueNotifications;
  }

  async function loadDispatchCache() {
    try {
      const cachedKeys = await dispatchCacheStore.readCache();

      for (const [dispatchKey, dispatchedAt] of cachedKeys.entries()) {
        dispatchedNotificationKeys.set(dispatchKey, dispatchedAt);
      }
    } catch (error) {
      logger.error("[notifications] Не вдалося прочитати кеш відправлених сповіщень.", error);
    }
  }

  function start() {
    if (timer) {
      return runner;
    }

    tick().catch((error) => {
      logger.error("[notifications] Помилка під час першої перевірки розкладу.", error);
    });

    timer = setInterval(() => {
      tick().catch((error) => {
        logger.error("[notifications] Помилка під час перевірки розкладу.", error);
      });
    }, tickIntervalMs);

    return runner;
  }

  function stop() {
    if (!timer) {
      return runner;
    }

    clearInterval(timer);
    timer = null;

    return runner;
  }

  const runner = {
    start,
    stop,
    tick,
    isRunning: () => timer !== null,
  };

  return runner;
}

module.exports = {
  DEFAULT_MISSED_NOTIFICATION_LOOKBACK_MS,
  DEFAULT_TICK_INTERVAL_MS,
  createNotificationRunner,
  findDueNotifications,
  getDueNotification,
};
