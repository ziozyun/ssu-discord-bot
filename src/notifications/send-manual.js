const { Client, Events, GatewayIntentBits } = require("discord.js");
const { ensureTimeZone } = require("../config/timezone");
const { createLogger } = require("../logger");
const {
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTestNotification,
  sendTruckBattleNotification,
} = require("./messages");

const logger = createLogger("manual-notification");
const timeZone = ensureTimeZone();
const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.NOTIFICATION_CHANNEL_ID;
const notificationKey = process.argv[2] || "test-notification";
const manualNotifications = Object.freeze({
  "test-notification": Object.freeze({
    id: "manual-test-notification",
    name: "Тестове повідомлення",
    callback: sendTestNotification,
    params: Object.freeze({
      text: process.env.TEST_NOTIFICATION_TEXT || "Бот успішно відправив тестове сповіщення.",
    }),
  }),
  "truck-battle": Object.freeze({
    id: "manual-truck-battle",
    name: "Битва за вантажівку",
    callback: sendTruckBattleNotification,
  }),
  "plane-crash": Object.freeze({
    id: "manual-plane-crash",
    name: "Падіння військового літака",
    callback: sendPlaneCrashNotification,
  }),
  "hammer-war": Object.freeze({
    id: "manual-hammer-war",
    name: "Війна за Hammer",
    callback: sendHammerWarNotification,
  }),
});
const manualNotification = manualNotifications[notificationKey];

if (!manualNotification) {
  logger.error(`Невідоме повідомлення для ручної відправки: ${notificationKey}.`);
  logger.error(`Доступні варіанти: ${Object.keys(manualNotifications).join(", ")}.`);
  process.exit(1);
}

if (!token) {
  logger.error("Не задано DISCORD_BOT_TOKEN.");
  process.exit(1);
}

if (!channelId) {
  logger.error("Не задано NOTIFICATION_CHANNEL_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async (readyClient) => {
  logger.info(`Бот готовий: ${readyClient.user.tag}.`);
  logger.info(`Timezone сповіщень: ${timeZone}.`);

  try {
    await manualNotification.callback(
      {
        id: manualNotification.id,
        time: "зараз",
        params: {
          ...manualNotification.params,
          time: "зараз",
        },
      },
      {
        client: readyClient,
        channelId,
        logger,
      },
    );

    logger.info(`Повідомлення "${manualNotification.name}" відправлено.`);
  } catch (error) {
    logger.error(`Не вдалося відправити повідомлення "${manualNotification.name}".`, error);
    process.exitCode = 1;
  } finally {
    readyClient.destroy();
  }
});

client.login(token).catch((error) => {
  logger.error("Не вдалося залогінити Discord-бота.", error);
  process.exit(1);
});
