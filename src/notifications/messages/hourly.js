const { EmbedBuilder } = require("discord.js");
const { sendDiscordChannelMessage } = require("../discord");

async function sendHourlyNotification(notification, context) {
  const params = notification.params || {};
  const time = params.time || notification.time;
  const embed = new EmbedBuilder()
    .setTitle(params.title || "Автоматична подія")
    .addFields(
      {
        name: "Початок",
        value: time,
        inline: true,
      },
      {
        name: "Команда для входу",
        value: "`/joinmp`",
        inline: true,
      },
      {
        name: "Де писати",
        value: "У чаті гри",
      },
    )
    .setColor(0x27ae60)
    .setTimestamp(new Date());

  await sendDiscordChannelMessage(
    { embeds: [embed] },
    {
      ...context,
      notification,
      roleId: process.env.HOURLY_NOTIFICATION_ROLE_ID,
    },
  );
}

module.exports = {
  sendHourlyNotification,
};
