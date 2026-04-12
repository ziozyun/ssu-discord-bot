const { EmbedBuilder } = require("discord.js");
const { sendDiscordChannelMessage } = require("../discord");

async function sendTruckBattleNotification(notification, context) {
  const params = notification.params || {};
  const eventTime = params.time || notification.time;
  const embed = new EmbedBuilder()
    .setTitle(params.title || "Битва за вантажівку")
    .setDescription(
      params.text ||
        "Через 20 хвилин почнеться БЗВ.\n" +
          "ОЗУ отримують повідомлення про появу вантажівки в чаті.",
    )
    .addFields(
      {
        name: "Мета",
        value:
          "ОЗУ: знайти вантажівку з матеріалами, зламати й доставити на титул.\n" +
          "Силові: відбити атаку, зберегти вантажівку й повернути її до держвласності.",
      },
      {
        name: "Склад",
        value: "4-50 людей на сторону.\nОЗУ можуть бути разом з однією союзною ОЗУ.",
      },
      {
        name: "Бій",
        value:
          "Вогонь заборонено на етапі пошуку вантажівки, крім законних підстав.\n" +
          "DM і частково PG дозволені з початку зламу до початку руху вантажівки.\n" +
          "Після початку руху DM без вагомої RP-причини заборонений.",
      },
      {
        name: "Спорядження",
        value:
          "Силові: максимум 2 бронежилети будь-якого рівня.\n" +
          "ОЗУ: 3 бронежилети до 2 рівня або 2 бронежилети 3 рівня.",
      },
      {
        name: "Транспорт",
        value:
          "БТР + Козак: максимум 2.\n" +
          "Suburban: максимум 8.\n" +
          "З гвинтокрила дозволено 1 кулемет; вогонь - тільки у відповідь або по ворожому гвинтокрилу.",
      },
      {
        name: "Заборонено",
        value:
          "Кемпити/скаутити спавн вантажівки в радіусі 1000 м.\n" +
          "Перекривати титули/місця здачі в радіусі 500 м.\n" +
          "Снайперки, Tec-9, Cargobob.\n" +
          "Не шкодити вантажівці, крім стрільби по колесах.\n" +
          "Не блокувати вантажівку, не затягувати злам/рух/здачу.",
      },
      {
        name: "Зона здачі",
        value: "У радіусі 300 м від місця здачі заборонено стріляти або перешкоджати здачі.",
      },
      {
        name: "Після бою",
        value:
          "Процесуальні дії, пограбування й викрадення - тільки коли вантажівка почала рух і немає перестрілки або загрози життю.",
      },
      {
        name: "Час у розкладі",
        value: eventTime,
        inline: true,
      },
    )
    .setColor(0xf2c94c)
    .setTimestamp(new Date());

  await sendDiscordChannelMessage({ embeds: [embed] }, { ...context, notification });
}

async function sendPlaneCrashNotification(notification, context) {
  const params = notification.params || {};
  const eventTime = params.time || notification.time;
  const embed = new EmbedBuilder()
    .setTitle(params.title || "Падіння військового літака")
    .setDescription(
      params.text ||
        "Через 20 хвилин почнеться падіння військового літака.\n" +
          "Силові отримують повідомлення першими, ОЗУ - через 2 хвилини після них.",
    )
    .addFields(
      {
        name: "Мета",
        value:
          "ОЗУ: викрасти 5-7 ящиків і доставити у свою зону здачі.\n" +
          "Силові: знайти ящики, не дати їх викрасти й доставити у свою зону.",
      },
      {
        name: "Склад",
        value: "4-40 людей на сторону.\nОЗУ можуть бути разом з однією союзною ОЗУ.",
      },
      {
        name: "Ящики",
        value:
          "Завантажувати ящики можна тільки у фракційний транспорт.\n" +
          "Івент завершується після здачі всіх ящиків.",
      },
      {
        name: "Бій",
        value: "На території івенту не діє DM і частково PG.\nPG діє з ситуації 1vs4 включно.",
      },
      {
        name: "Спорядження",
        value:
          "Силові: максимум 2 бронежилети будь-якого рівня.\n" +
          "ОЗУ: 3 бронежилети до 2 рівня або 2 бронежилети 3 рівня.",
      },
      {
        name: "Транспорт",
        value:
          "БТР + Козак: максимум 2.\n" +
          "Suburban: максимум 8.\n" +
          "З гвинтокрила дозволено 1 кулемет; вогонь - тільки у відповідь або по ворожому гвинтокрилу.",
      },
      {
        name: "Заборонено",
        value:
          "Кемпити/скаутити спавн літака в радіусі 1000 м.\n" +
          "Кемпити/перекривати здачу ящиків у радіусі 500 м.\n" +
          "Снайперки, Tec-9, шкода авто з ящиками, респавн транспорту з ящиками й затягування здачі.",
      },
      {
        name: "Після бою",
        value: "Процесуальні дії, пограбування й викрадення - тільки коли немає перестрілки або загрози життю.",
      },
      {
        name: "Час у розкладі",
        value: eventTime,
        inline: true,
      },
    )
    .setColor(0x56ccf2)
    .setTimestamp(new Date());

  await sendDiscordChannelMessage({ embeds: [embed] }, { ...context, notification });
}

async function sendHammerWarNotification(notification, context) {
  const params = notification.params || {};
  const officialAnnouncementTime = params.time || notification.time;
  const hummerArrivalTime = addMinutesToScheduleTime(officialAnnouncementTime, 10) || "через 10 хвилин";
  const embed = new EmbedBuilder()
    .setTitle(params.title || "Війна за Hammer")
    .setDescription(
      params.text ||
        "Через 30 хвилин прибуде Hummer.\nЧерез 20 хвилин буде офіційне повідомлення про його появу.",
    )
    .addFields(
      {
        name: "Мета",
        value: "Захопити Hummer, доставити на титул і втримати.",
      },
      {
        name: "Склад",
        value: "4-50 людей на сторону.",
        inline: true,
      },
      {
        name: "Вогонь",
        value:
          "Не відкривати вогонь до офіційного повідомлення про спавн Hummer.\n" +
          "Після спавну під час захоплення, транспортування та утримання дозволені DM, RK і частково PG.",
      },
      {
        name: "Транспорт",
        value:
          "Тільки фракційний транспорт.\n" +
          "Виняток для ОЗУ: особисті гвинтокрили.\n" +
          "Дозволено лише 1 кулемет з гвинтокрила.\n" +
          "Стріляти з гвинтокрила можна тільки якщо по ньому вже відкрили вогонь, або по не союзному гвинтокрилу.",
      },
      {
        name: "Заборонено",
        value:
          "Снайперки, Tec-9, Cargobob.\n" +
          "Не нищити, не блокувати й не таранити Hummer.\n" +
          "Під час здачі відкривати вогонь тільки в межах зони мітки Hummer.",
      },
      {
        name: "Після івенту",
        value:
          "Стороннім гравцям заборонено втручатися, провокувати та заважати івенту.\n" +
          "Процесуальні дії, пограбування й викрадення - тільки після івенту та без активної загрози.",
      },
      {
        name: "Офіційне повідомлення",
        value: officialAnnouncementTime,
        inline: true,
      },
      {
        name: "Поява Hummer",
        value: hummerArrivalTime,
        inline: true,
      },
    )
    .setColor(0xeb5757)
    .setTimestamp(new Date());

  await sendDiscordChannelMessage({ embeds: [embed] }, { ...context, notification });
}

function addMinutesToScheduleTime(time, minutesToAdd) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    return null;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  return `${String(Math.floor(normalizedMinutes / 60)).padStart(2, "0")}:${String(
    normalizedMinutes % 60,
  ).padStart(2, "0")}`;
}

module.exports = {
  addMinutesToScheduleTime,
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTruckBattleNotification,
};
