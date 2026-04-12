const assert = require("node:assert/strict");
const test = require("node:test");

const {
  addMinutesToScheduleTime,
  sendHammerWarNotification,
  sendPlaneCrashNotification,
  sendTestNotification,
  sendTruckBattleNotification,
} = require(".");

test("відправляє тестове embed-повідомлення у Discord-канал", async () => {
  const sentMessages = [];
  const roleId = "1492260885945647256";
  const client = {
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async (message) => sentMessages.push(message),
      }),
    },
  };

  await sendTestNotification(
    {
      id: "test-notification",
      time: "18:00",
      params: {
        text: "Тест працює.",
        time: "18:00",
      },
    },
    {
      client,
      channelId: "123",
      roleId,
    },
  );

  assert.equal(sentMessages.length, 1);
  assert.equal(sentMessages[0].content, `<@&${roleId}>`);
  assert.equal(sentMessages[0].embeds.length, 1);

  const embed = sentMessages[0].embeds[0].toJSON();

  assert.equal(embed.title, "Тестове сповіщення");
  assert.equal(embed.description, "Тест працює.");
  assert.deepEqual(embed.fields, [
    {
      name: "Час у розкладі",
      value: "18:00",
      inline: true,
    },
  ]);
});

test("відправляє заготовки івентів як embed-повідомлення", async () => {
  const cases = [
    ["truck-battle", sendTruckBattleNotification, "Битва за вантажівку"],
    ["plane-crash", sendPlaneCrashNotification, "Падіння військового літака"],
    ["hammer-war", sendHammerWarNotification, "Війна за Hammer"],
  ];

  for (const [id, callback, title] of cases) {
    const sentMessages = [];

    await callback(
      {
        id,
        time: "18:00",
        params: {
          time: "18:00",
        },
      },
      createDiscordContext(sentMessages),
    );

    assert.equal(sentMessages.length, 1);
    assert.equal(sentMessages[0].embeds.length, 1);
    assert.equal(sentMessages[0].embeds[0].toJSON().title, title);
  }
});

test("відправляє правила війни за Hammer у структурованому embed", async () => {
  const sentMessages = [];

  await sendHammerWarNotification(
    {
      id: "hammer-war",
      time: "21:00",
      params: {
        time: "21:00",
      },
    },
    createDiscordContext(sentMessages),
  );

  const embed = sentMessages[0].embeds[0].toJSON();
  const fields = Object.fromEntries(embed.fields.map(({ name, value }) => [name, value]));

  assert.equal(embed.title, "Війна за Hammer");
  assert.match(embed.description, /Через 30 хвилин прибуде Hummer/);
  assert.match(embed.description, /Через 20 хвилин буде офіційне повідомлення/);
  assert.equal(fields["Склад"], "4-50 людей на сторону.");
  assert.match(fields["Вогонь"], /Не відкривати вогонь до офіційного повідомлення/);
  assert.match(fields["Транспорт"], /Тільки фракційний транспорт/);
  assert.match(fields["Транспорт"], /лише 1 кулемет/);
  assert.match(fields["Заборонено"], /Снайперки, Tec-9, Cargobob/);
  assert.match(fields["Заборонено"], /в межах зони мітки Hummer/);
  assert.match(fields["Після івенту"], /Стороннім гравцям заборонено втручатися/);
  assert.equal(fields["Офіційне повідомлення"], "21:00");
  assert.equal(fields["Поява Hummer"], "21:10");
});

test("відправляє правила падіння військового літака у структурованому embed", async () => {
  const sentMessages = [];

  await sendPlaneCrashNotification(
    {
      id: "plane-crash",
      time: "16:00",
      params: {
        time: "16:00",
      },
    },
    createDiscordContext(sentMessages),
  );

  const embed = sentMessages[0].embeds[0].toJSON();
  const fields = Object.fromEntries(embed.fields.map(({ name, value }) => [name, value]));

  assert.equal(embed.title, "Падіння військового літака");
  assert.match(embed.description, /Через 20 хвилин почнеться падіння військового літака/);
  assert.match(embed.description, /ОЗУ - через 2 хвилини/);
  assert.match(fields["Мета"], /викрасти 5-7 ящиків/);
  assert.match(fields["Мета"], /Силові: знайти ящики/);
  assert.match(fields["Склад"], /4-40 людей/);
  assert.match(fields["Ящики"], /тільки у фракційний транспорт/);
  assert.match(fields["Бій"], /не діє DM/);
  assert.match(fields["Спорядження"], /максимум 2 бронежилети/);
  assert.match(fields["Транспорт"], /Suburban: максимум 8/);
  assert.match(fields["Заборонено"], /радіусі 1000 м/);
  assert.match(fields["Після бою"], /коли немає перестрілки/);
  assert.equal(fields["Час у розкладі"], "16:00");
});

test("відправляє правила битви за вантажівку у структурованому embed", async () => {
  const sentMessages = [];

  await sendTruckBattleNotification(
    {
      id: "truck-battle",
      time: "12:00",
      params: {
        time: "12:00",
      },
    },
    createDiscordContext(sentMessages),
  );

  const embed = sentMessages[0].embeds[0].toJSON();
  const fields = Object.fromEntries(embed.fields.map(({ name, value }) => [name, value]));

  assert.equal(embed.title, "Битва за вантажівку");
  assert.match(embed.description, /Через 20 хвилин почнеться БЗВ/);
  assert.match(fields["Мета"], /знайти вантажівку з матеріалами/);
  assert.match(fields["Мета"], /Силові: відбити атаку/);
  assert.match(fields["Склад"], /4-50 людей/);
  assert.match(fields["Бій"], /Вогонь заборонено на етапі пошуку/);
  assert.match(fields["Бій"], /з початку зламу до початку руху/);
  assert.match(fields["Спорядження"], /максимум 2 бронежилети/);
  assert.match(fields["Транспорт"], /Suburban: максимум 8/);
  assert.match(fields["Заборонено"], /радіусі 1000 м/);
  assert.match(fields["Зона здачі"], /радіусі 300 м/);
  assert.match(fields["Після бою"], /вантажівка почала рух/);
  assert.equal(fields["Час у розкладі"], "12:00");
});

test("рахує час появи Hummer після офіційного повідомлення", () => {
  assert.equal(addMinutesToScheduleTime("21:00", 10), "21:10");
  assert.equal(addMinutesToScheduleTime("23:55", 10), "00:05");
  assert.equal(addMinutesToScheduleTime("зараз", 10), null);
});

test("для ручного запуску показує появу Hummer як відносний час", async () => {
  const sentMessages = [];

  await sendHammerWarNotification(
    {
      id: "hammer-war",
      time: "зараз",
      params: {
        time: "зараз",
      },
    },
    createDiscordContext(sentMessages),
  );

  const embed = sentMessages[0].embeds[0].toJSON();
  const fields = Object.fromEntries(embed.fields.map(({ name, value }) => [name, value]));

  assert.equal(fields["Офіційне повідомлення"], "зараз");
  assert.equal(fields["Поява Hummer"], "через 10 хвилин");
});

function createDiscordContext(sentMessages) {
  return {
    client: {
      channels: {
        fetch: async () => ({
          isTextBased: () => true,
          send: async (message) => sentMessages.push(message),
        }),
      },
    },
    channelId: "123",
    roleId: "1492260885945647256",
  };
}
