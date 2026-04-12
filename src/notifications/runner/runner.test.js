const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { WEEK_DAYS } = require("../schedule/days");
const { createNotificationRunner } = require(".");

test("викликає callback за 20 хвилин до часу у розкладі", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T11:40:30"));

  assert.equal(dispatchedNotifications.length, 1);
  assert.equal(dispatchedNotifications[0].id, "sunday-message");
});

test("підтримує leadTimeMinutes на рівні окремого сповіщення", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "hourly-message", time: "13:00", leadTimeMinutes: 5 }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T12:55:00"));

  assert.equal(dispatchedNotifications.length, 1);
  assert.equal(dispatchedNotifications[0].id, "hourly-message");
});

test("викликає callback, якщо перевірка розкладу трохи запізнилася", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T11:41:00"));

  assert.equal(dispatchedNotifications.length, 1);
  assert.equal(dispatchedNotifications[0].id, "sunday-message");
});

test("підхоплює пропущений слот до старту події", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T11:43:00"));

  assert.equal(dispatchedNotifications.length, 1);
  assert.equal(dispatchedNotifications[0].id, "sunday-message");
});

test("не відправляє пропущений слот після старту події", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T12:00:00"));

  assert.equal(dispatchedNotifications.length, 0);
});

test("підтримує нагадування для часу після опівночі наступного тижня", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.MONDAY,
        messages: [{ id: "monday-after-midnight", time: "00:10" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T23:50:00"));

  assert.equal(dispatchedNotifications.length, 1);
  assert.equal(dispatchedNotifications[0].id, "monday-after-midnight");
});

test("не дублює callback для одного слоту в межах lookback-вікна", async () => {
  const dispatchedNotifications = [];
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    onNotification: (notification) => dispatchedNotifications.push(notification),
  });

  await runner.tick(new Date("2026-04-12T11:40:10"));
  await runner.tick(new Date("2026-04-12T11:42:00"));

  assert.equal(dispatchedNotifications.length, 1);
});

test("не дублює callback після рестарту, якщо слот є у файловому кеші", async () => {
  const persistedCache = new Map();
  const firstRunNotifications = [];
  const firstRunner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    dispatchCacheStore: createFakeDispatchCacheStore(persistedCache),
    onNotification: (notification) => firstRunNotifications.push(notification),
  });

  await firstRunner.tick(new Date("2026-04-12T11:40:00"));

  const secondRunNotifications = [];
  const secondRunner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    dispatchCacheStore: createFakeDispatchCacheStore(persistedCache),
    onNotification: (notification) => secondRunNotifications.push(notification),
  });

  await secondRunner.tick(new Date("2026-04-12T11:41:00"));

  assert.equal(firstRunNotifications.length, 1);
  assert.equal(secondRunNotifications.length, 0);
});

test("повторює відправку після помилки callback у межах lookback-вікна", async () => {
  let attempts = 0;
  const logger = {
    error: () => {},
  };
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [{ id: "sunday-message", time: "12:00" }],
      },
    ],
    logger,
    onNotification: () => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error("Temporary Discord error");
      }
    },
  });

  await runner.tick(new Date("2026-04-12T11:40:00"));
  await runner.tick(new Date("2026-04-12T11:40:30"));
  await runner.tick(new Date("2026-04-12T11:40:50"));

  assert.equal(attempts, 2);
});

test("передає runtime context у callback зі сповіщення", async () => {
  let callbackChannelId = null;
  const runner = createTestNotificationRunner({
    schedule: [
      {
        day: WEEK_DAYS.SUNDAY,
        messages: [
          {
            id: "sunday-message",
            time: "12:00",
            callback: (notification, context) => {
              callbackChannelId = context.channelId;
            },
          },
        ],
      },
    ],
    context: { channelId: "123" },
    onNotification: () => {},
  });

  await runner.tick(new Date("2026-04-12T11:40:00"));

  assert.equal(callbackChannelId, "123");
});

function createFakeDispatchCacheStore(cache) {
  return {
    readCache: async () => new Map(cache),
    writeCache: async (nextCache) => {
      cache.clear();

      for (const entry of nextCache.entries()) {
        cache.set(...entry);
      }
    },
  };
}

function createTestNotificationRunner(options) {
  return createNotificationRunner({
    dispatchCacheStore: createFakeDispatchCacheStore(new Map()),
    ...options,
  });
}
