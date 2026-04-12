const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const {
  buildEventsCommandResponse,
  getOperationalDayOccurrences,
  getOperationalDayStart,
  resolveDaySelection,
} = require("./events");
const { WEEKLY_NOTIFICATION_SCHEDULE } = require("../notifications/schedule");

test("рахує ігровий день з 06:00 до 05:59", () => {
  const earlyMorningStart = getOperationalDayStart(new Date(2026, 3, 12, 4, 0));
  const morningStart = getOperationalDayStart(new Date(2026, 3, 12, 7, 0));

  assert.equal(earlyMorningStart.toString(), new Date(2026, 3, 11, 6, 0).toString());
  assert.equal(morningStart.toString(), new Date(2026, 3, 12, 6, 0).toString());
});

test("до 06:00 сьогодні лишається попереднім ігровим днем", () => {
  const selection = resolveDaySelection("today", new Date(2026, 3, 12, 4, 0));
  const occurrences = getOperationalDayOccurrences(
    WEEKLY_NOTIFICATION_SCHEDULE,
    selection.startAt,
    selection.endAt,
  );

  assert.equal(selection.startAt.toString(), new Date(2026, 3, 11, 6, 0).toString());
  assert.deepEqual(
    occurrences.map(({ notification }) => notification.id),
    [
      "plane-crash-saturday-1300",
      "truck-battle-saturday-1500",
      "plane-crash-saturday-1900",
      "hammer-war-saturday-2100",
      "truck-battle-saturday-2200",
      "hammer-war-sunday-0000",
    ],
  );
});

test("після 06:00 сьогодні показує поточний ігровий день і наступну подію", () => {
  const response = buildEventsCommandResponse({
    now: new Date(2026, 3, 12, 7, 0),
  });
  const embed = response.embeds[0].toJSON();
  const fields = Object.fromEntries(embed.fields.map(({ name, value }) => [name, value]));

  assert.equal(embed.title, "Події на сьогодні");
  assert.match(embed.description, /неділя 12\.04\.2026 06:00 - понеділок 13\.04\.2026 05:59/);
  assert.equal(fields["Найближча подія"], "**12:00** - Битва за вантажівку\nПовідомлення: 11:40");
  assert.match(fields["Розклад"], /\*\*12:00\*\* - Битва за вантажівку\nПовідомлення: 11:40/);
  assert.match(fields["Розклад"], /\*\*00:00 \(\+1 день\)\*\* - Війна за Hammer\nПовідомлення: 23:40\nHummer: 00:10 \(\+1 день\)/);
});

test("завтра показує розклад без блоку наступної події", () => {
  const response = buildEventsCommandResponse({
    dayOption: "tomorrow",
    now: new Date(2026, 3, 12, 7, 0),
  });
  const embed = response.embeds[0].toJSON();

  assert.equal(embed.title, "Події на завтра");
  assert.deepEqual(embed.fields.map(({ name }) => name), ["Розклад"]);
});
