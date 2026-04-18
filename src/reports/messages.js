const { createLogger } = require("../logger");

const DEFAULT_PAGE_LIMIT = 100;
const DEFAULT_LOGGER = createLogger("reports");

async function fetchReportMessages({
  client,
  channelIds,
  period,
  pageLimit = DEFAULT_PAGE_LIMIT,
  logger = DEFAULT_LOGGER,
} = {}) {
  if (!client?.channels?.fetch) {
    throw new Error("Немає Discord client для збору повідомлень.");
  }

  if (!Array.isArray(channelIds) || !channelIds.length) {
    throw new Error("channelIds має бути непорожнім масивом.");
  }

  if (!period?.startDate || !period?.endDate) {
    throw new Error("period має містити startDate та endDate.");
  }

  const messages = [];

  for (const channelId of channelIds) {
    const channel = await client.channels.fetch(channelId);

    if (!channel?.messages?.fetch) {
      logger.warn?.(`[reports] Канал ${channelId} не підтримує читання повідомлень.`);
      continue;
    }

    const channelMessages = await fetchChannelMessages({ channel, period, pageLimit });
    messages.push(...channelMessages);
  }

  return messages.sort((left, right) => left.createdTimestamp - right.createdTimestamp);
}

async function fetchChannelMessages({ channel, period, pageLimit = DEFAULT_PAGE_LIMIT }) {
  const messages = [];
  let before;

  while (true) {
    const page = await channel.messages.fetch({
      limit: pageLimit,
      ...(before ? { before } : {}),
    });
    const pageMessages = Array.from(page.values());

    if (!pageMessages.length) {
      break;
    }

    for (const message of pageMessages) {
      if (message.createdTimestamp < period.startDate.getTime()) {
        continue;
      }

      if (message.createdTimestamp <= period.endDate.getTime()) {
        messages.push(message);
      }
    }

    const oldestMessage = pageMessages.reduce((oldest, message) =>
      message.createdTimestamp < oldest.createdTimestamp ? message : oldest,
    );

    if (oldestMessage.createdTimestamp < period.startDate.getTime()) {
      break;
    }

    before = oldestMessage.id;
  }

  return messages;
}

module.exports = {
  DEFAULT_PAGE_LIMIT,
  fetchChannelMessages,
  fetchReportMessages,
};
