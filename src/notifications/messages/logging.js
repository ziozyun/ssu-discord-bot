async function logUnconfiguredNotification(notification, { logger = console } = {}) {
  logger.info(`[notifications] Callback для сповіщення ${notification.id} ще не налаштований.`);
}

module.exports = {
  logUnconfiguredNotification,
};
