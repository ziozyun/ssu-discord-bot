const { ensureTimeZone } = require("./config/timezone");
const timeZone = ensureTimeZone();
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { startNotifications } = require("./notifications");

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.NOTIFICATION_CHANNEL_ID;

if (!token) {
  console.error("Не задано DISCORD_BOT_TOKEN");
  process.exit(1);
}

if (!channelId) {
  console.error("Не задано NOTIFICATION_CHANNEL_ID");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Бот готовий: ${readyClient.user.tag}`);
  console.log(`Timezone сповіщень: ${timeZone}`);
  startNotifications({ client: readyClient, channelId });
});

client.login(token).catch((error) => {
  console.error("Не вдалося залогінити Discord-бота.", error);
  process.exit(1);
});
