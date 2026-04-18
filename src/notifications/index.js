const { createLogger } = require("../logger");
const { createNotificationRunner } = require("./runner");
const { logUnconfiguredNotification } = require("./messages");
const { WEEKLY_NOTIFICATION_SCHEDULE } = require("./schedule");

const DEFAULT_LOGGER = createLogger("notifications");

function startNotifications({
  client,
  schedule = WEEKLY_NOTIFICATION_SCHEDULE,
  logger = DEFAULT_LOGGER,
  channelId = process.env.NOTIFICATION_CHANNEL_ID,
} = {}) {
  const runner = createNotificationRunner({
    schedule,
    logger,
    context: { client, channelId, logger },
    onNotification: logUnconfiguredNotification,
  });

  return runner.start();
}

module.exports = {
  startNotifications,
};
