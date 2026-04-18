const { ensureTimeZone } = require("./config/timezone");
const timeZone = ensureTimeZone();
const { Client, Events, GatewayIntentBits, Partials } = require("discord.js");
const { handleCommandInteraction, registerCommands } = require("./commands");
const { createLogger } = require("./logger");
const { startNotifications } = require("./notifications");
const { startWeeklyReportAutoRunner } = require("./reports/auto-runner");

const logger = createLogger("bot");
const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.NOTIFICATION_CHANNEL_ID;

if (!token) {
  logger.error("Не задано DISCORD_BOT_TOKEN.");
  process.exit(1);
}

if (!channelId) {
  logger.error("Не задано NOTIFICATION_CHANNEL_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.once(Events.ClientReady, (readyClient) => {
  logger.info(`Бот готовий: ${readyClient.user.tag}.`);
  logger.info(`Timezone сповіщень: ${timeZone}.`);
  startNotifications({ client: readyClient, channelId, logger });
  startWeeklyReportAutoRunner({ client: readyClient, logger });
  registerCommands({ client: readyClient, logger }).catch((error) => {
    logger.error("Не вдалося зареєструвати slash-команди.", error);
  });
});

client.on(Events.InteractionCreate, (interaction) => {
  handleCommandInteraction(interaction, { logger }).catch((error) => {
    logger.error("Не вдалося обробити Discord interaction.", error);
  });
});

client.login(token).catch((error) => {
  logger.error("Не вдалося залогінити Discord-бота.", error);
  process.exit(1);
});
