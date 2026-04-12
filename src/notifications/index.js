const { createNotificationRunner } = require("./runner");
const { logUnconfiguredNotification } = require("./messages");
const { WEEKLY_NOTIFICATION_SCHEDULE } = require("./schedule");

function startNotifications({
  client,
  schedule = WEEKLY_NOTIFICATION_SCHEDULE,
  logger = console,
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
