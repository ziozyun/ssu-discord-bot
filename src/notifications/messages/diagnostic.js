const { EmbedBuilder } = require("discord.js");
const { sendDiscordChannelMessage } = require("../discord");

async function sendTestNotification(notification, context) {
  const params = notification.params || {};
  const embed = new EmbedBuilder()
    .setTitle("Тестове сповіщення")
    .setDescription(params.text || "Бот успішно відправив тестове сповіщення.")
    .addFields({
      name: "Час у розкладі",
      value: params.time || notification.time,
      inline: true,
    })
    .setColor(0x2f80ed)
    .setTimestamp(new Date());

  await sendDiscordChannelMessage({ embeds: [embed] }, { ...context, notification });
}

module.exports = {
  sendTestNotification,
};
