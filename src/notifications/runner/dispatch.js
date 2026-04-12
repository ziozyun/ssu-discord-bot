async function dispatchNotification(notification, defaultCallback, logger, context) {
  const callback = notification.callback || defaultCallback;

  try {
    await callback(notification, context);
    return true;
  } catch (error) {
    logger.error(`[notifications] Не вдалося виконати callback для ${notification.id}.`, error);
    return false;
  }
}

module.exports = {
  dispatchNotification,
};
