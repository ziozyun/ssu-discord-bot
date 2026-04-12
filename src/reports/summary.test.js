const assert = require("node:assert/strict");
const test = require("node:test");

const { ARREST_REPORT_ID } = require("./definitions/arrest");
const { HOSTAGE_RESCUE_REPORT_ID } = require("./definitions/hostage-rescue");
const { INTERROGATION_REPORT_ID } = require("./definitions/interrogation");
const { NEGOTIATION_REPORT_ID } = require("./definitions/negotiation");
const { SEARCH_REPORT_ID } = require("./definitions/search");
const { TRUCK_BATTLE_REPORT_ID } = require("./definitions/truck-battle");
const { VEHICLE_ACTIVITY_REPORT_ID } = require("./definitions/vehicle-activity");
const { buildWeeklySummaryHeader, buildWeeklySummaryRows } = require("./summary");

test("формує зведені рядки тижневого звіту по користувачах", async () => {
  const rows = await buildWeeklySummaryRows(
    [
      {
        reportId: VEHICLE_ACTIVITY_REPORT_ID,
        result: {
          participants: [
            { count: 3, userId: "user-2" },
            { count: 1, userId: "user-1" },
          ],
        },
      },
      {
        reportId: ARREST_REPORT_ID,
        result: {
          participants: [
            { count: 4, userId: "user-1" },
            { count: 2, userId: "user-3" },
          ],
        },
      },
      {
        reportId: INTERROGATION_REPORT_ID,
        result: {
          participants: [
            {
              count: {
                conducted: 2,
                participated: 0,
              },
              userId: "user-1",
            },
            {
              count: {
                conducted: 0,
                participated: 5,
              },
              userId: "user-4",
            },
          ],
        },
      },
      {
        reportId: SEARCH_REPORT_ID,
        result: {
          participants: [
            { count: 7, userId: "user-3" },
          ],
        },
      },
      {
        reportId: NEGOTIATION_REPORT_ID,
        result: {
          participants: [
            {
              count: {
                conducted: 1,
                controlled: 0,
              },
              userId: "user-2",
            },
            {
              count: {
                conducted: 0,
                controlled: 3,
              },
              userId: "user-4",
            },
          ],
        },
      },
      {
        reportId: TRUCK_BATTLE_REPORT_ID,
        result: {
          participants: [
            {
              count: {
                failed: 2,
                successful: 0,
              },
              userId: "user-1",
            },
            {
              count: {
                failed: 0,
                successful: 4,
              },
              userId: "user-4",
            },
          ],
        },
      },
      {
        reportId: HOSTAGE_RESCUE_REPORT_ID,
        result: {
          participants: [
            {
              count: {
                failed: 1,
                successful: 0,
              },
              userId: "user-2",
            },
            {
              count: {
                failed: 0,
                successful: 2,
              },
              userId: "user-3",
            },
          ],
        },
      },
    ],
    {
      client: {
        users: {
          fetch: async (userId) => ({
            username: {
              "user-1": "Bohdan",
              "user-2": "Andrii",
              "user-3": "Serhii",
              "user-4": "Dmytro",
            }[userId],
          }),
        },
      },
    },
  );

  assert.deepEqual(buildWeeklySummaryHeader(), [
    "Ініціали",
    "Угонка/SOTW/Фургон",
    "Арешт",
    "Проведення допиту",
    "Участь в допиті",
    "Обшук",
    "Участь в організації та контроль перемовин",
    "Проведення перемовин",
    "Неуспішне БЗВ",
    "Успішне БЗВ",
    "Неуспішне ВЗХ",
    "Успішне ВЗХ",
    "ФЗ/ЗАХИСТ АВІАНОСЦЯ",
    "ПОСТАЧАННЯ",
    "Крах літака (участь)",
    "Крах літака (ящики)",
  ]);
  assert.deepEqual(rows, [
    ["Andrii", 3, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
    ["Bohdan", 1, 4, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0],
    ["Dmytro", 0, 0, 0, 5, 0, 3, 0, 0, 4, 0, 0, 0, 0, 0, 0],
    ["Serhii", 0, 2, 0, 0, 7, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
  ]);
});
