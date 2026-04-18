const { createLogger } = require("../../logger");

const DEFAULT_LOGGER = createLogger("notifications");

async function logUnconfiguredNotification(notification, { logger = DEFAULT_LOGGER } = {}) {
  logger.info(`[notifications] Callback для сповіщення ${notification.id} ще не налаштований.`);
}

module.exports = {
  logUnconfiguredNotification,
};
