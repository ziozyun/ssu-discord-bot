const { Client, Events, GatewayIntentBits } = require("discord.js");
const { ensureTimeZone } = require("../config/timezone");
const {
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTestNotification,
  sendTruckBattleNotification,
} = require("./messages");

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
  console.error(`Невідоме повідомлення для ручної відправки: ${notificationKey}.`);
  console.error(`Доступні варіанти: ${Object.keys(manualNotifications).join(", ")}.`);
  process.exit(1);
}

if (!token) {
  console.error("Не задано DISCORD_BOT_TOKEN.");
  process.exit(1);
}

if (!channelId) {
  console.error("Не задано NOTIFICATION_CHANNEL_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Бот готовий: ${readyClient.user.tag}`);
  console.log(`Timezone сповіщень: ${timeZone}`);

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
        logger: console,
      },
    );

    console.log(`Повідомлення "${manualNotification.name}" відправлено.`);
  } catch (error) {
    console.error(`Не вдалося відправити повідомлення "${manualNotification.name}".`, error);
    process.exitCode = 1;
  } finally {
    readyClient.destroy();
  }
});

client.login(token).catch((error) => {
  console.error("Не вдалося залогінити Discord-бота.", error);
  process.exit(1);
});
