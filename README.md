# ssu-discord-bot

## Сповіщення

Заготовка сповіщень лежить у `src/notifications`.

- Час у розкладі задається в timezone `Europe/Kyiv`. Для Docker це задано через `TZ=Europe/Kyiv`.
- `schedule/` містить тижневий розклад від понеділка до неділі. Повідомлення додаються в `messages` потрібного дня у форматі `{ id, time: "HH:mm", params, callback }`.
- `messages/` містить callback-и повідомлень. Callback отримує `(notification, context)`, де в `context` є `client`, `channelId` і `logger`.
- `discord/` містить helper для відправки готового Discord payload у канал: рядок, embed або об'єкт для `channel.send()`.
- `runner/` викликає callback за 20 хвилин до часу з розкладу й не дублює один слот у межах тієї самої хвилини.

Основні файли:

- `schedule/events.js` - бойовий розклад для `Війна за Hammer`, `Битва за вантажівку`, `Падіння військового літака`.
- `schedule/diagnostic.js` - env-кероване тестове сповіщення.
- `schedule/normalize.js` - валідація розкладу й захист від дубльованих `id`.
- `messages/events.js` - тексти й embed-и бойових подій.
- `messages/diagnostic.js` - тестове embed-повідомлення.
- `runner/due.js` - пошук сповіщень, які треба відправити зараз.
- `runner/dispatch.js` - запуск callback-а сповіщення.
- `runner/cache.js` - чистка кешу вже відправлених слотів.

Для перевірки відправки можна увімкнути тестове embed-повідомлення через `.env`:

```env
TEST_NOTIFICATION_ENABLED=true
TEST_NOTIFICATION_DAY=7
TEST_NOTIFICATION_TIME=18:00
TEST_NOTIFICATION_TEXT=Бот успішно відправив тестове сповіщення.
```

`NOTIFICATION_ROLE_ID` додається як згадка ролі до кожного повідомлення. `TEST_NOTIFICATION_DAY` задається числом від `1` до `7`, де `1` - понеділок, `7` - неділя. `TEST_NOTIFICATION_TIME` - час події в Києві, а повідомлення відправиться за 20 хвилин до нього. Для швидкої перевірки постав час на 20 хвилин пізніше поточного київського часу.

Поточний бойовий розклад:

- `Війна за Hammer`: офіційне повідомлення щодня о `00:00` і `21:00`; поява Hummer о `00:10` і `21:10`.
- `Битва за вантажівку`: у понеділок, середу, п'ятницю та неділю о `12:00` і `18:00`; у вівторок, четвер і суботу о `15:00` і `22:00`.
- `Падіння військового літака`: у понеділок, середу, п'ятницю та неділю о `16:00` і `23:00`; у вівторок, четвер і суботу о `13:00` і `19:00`.

Щоб відправити повідомлення одразу, без очікування розкладу:

```sh
npm run send:test-notification
npm run send:truck-battle
npm run send:plane-crash
npm run send:hammer-war
```

Приклад callback у `src/notifications/messages/index.js`:

```js
const { EmbedBuilder } = require("discord.js");
const { sendDiscordChannelMessage } = require("../discord");

async function logUnconfiguredNotification(notification, { logger = console } = {}) {
  logger.info(`[notifications] Callback для сповіщення ${notification.id} ще не налаштований.`);
}

async function sendSundayReminder(notification, context) {
  const message = {
    content: `Нагадування: подія почнеться о ${notification.params.time}.`,
  };

  await sendDiscordChannelMessage(message, { ...context, notification });
}

async function sendSundayReminderEmbed(notification, context) {
  const embed = new EmbedBuilder()
    .setTitle("Нагадування")
    .setDescription(`Подія почнеться о ${notification.params.time}.`);

  await sendDiscordChannelMessage({ embeds: [embed] }, { ...context, notification });
}

module.exports = {
  logUnconfiguredNotification,
  sendSundayReminderEmbed,
  sendSundayReminder,
};
```

Приклад запису в `src/notifications/schedule/index.js`:

```js
const { sendSundayReminder } = require("../messages");

Object.freeze({
  id: "sunday-reminder",
  time: "18:00",
  params: Object.freeze({ time: "18:00" }),
  callback: sendSundayReminder,
});
```
