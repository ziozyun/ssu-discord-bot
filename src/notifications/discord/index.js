async function sendDiscordChannelMessage(
  message,
  { client, channelId, roleId = process.env.NOTIFICATION_ROLE_ID, logger = console, notification } = {},
) {
  if (!message) {
    logger.info(`[notifications] Порожнє повідомлення для сповіщення ${notification?.id || "без id"}.`);
    return;
  }

  if (!client) {
    logger.warn(`[notifications] Немає Discord client для сповіщення ${notification?.id || "без id"}.`);
    return;
  }

  if (!channelId) {
    logger.warn(`[notifications] Немає NOTIFICATION_CHANNEL_ID для сповіщення ${notification?.id || "без id"}.`);
    return;
  }

  const channel = await client.channels.fetch(channelId);

  if (!channel || typeof channel.isTextBased !== "function" || !channel.isTextBased()) {
    logger.warn(`[notifications] Канал ${channelId} не підтримує текстові повідомлення.`);
    return;
  }

  await channel.send(addRoleMention(message, roleId));
}

function addRoleMention(message, roleId) {
  if (!roleId) {
    return message;
  }

  const roleMention = `<@&${roleId}>`;
  const allowedMentions = addAllowedRoleMention(message.allowedMentions, roleId);

  if (typeof message === "string") {
    return {
      content: `${roleMention}\n${message}`,
      allowedMentions,
    };
  }

  if (!isPlainMessagePayload(message)) {
    return {
      content: roleMention,
      allowedMentions,
      embeds: [message],
    };
  }

  return {
    ...message,
    content: message.content ? `${roleMention}\n${message.content}` : roleMention,
    allowedMentions,
  };
}

function addAllowedRoleMention(allowedMentions = {}, roleId) {
  return {
    ...allowedMentions,
    roles: Array.from(new Set([...(allowedMentions.roles || []), roleId])),
  };
}

function isPlainMessagePayload(message) {
  return message && typeof message === "object" && !Array.isArray(message) && Object.getPrototypeOf(message) === Object.prototype;
}

module.exports = {
  addRoleMention,
  sendDiscordChannelMessage,
};
