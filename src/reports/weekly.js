const { REPORT_DEFINITIONS } = require("./definitions");
const { getCurrentReportPeriod } = require("./period");
const { collectReport } = require("./runner");
const { writeSheetRows } = require("./sheets");
const { resolveReportUserNames } = require("./user-names");

// 🔥 ВСІ ІМПОРТИ
const { VEHICLE_ACTIVITY_REPORT_ID } = require("./definitions/vehicle-activity");
const { ARREST_REPORT_ID } = require("./definitions/arrest");
const { INTERROGATION_REPORT_ID } = require("./definitions/interrogation");
const { NEGOTIATION_REPORT_ID } = require("./definitions/negotiation");
const { SEARCH_REPORT_ID } = require("./definitions/search");
const { TRUCK_BATTLE_REPORT_ID } = require("./definitions/truck-battle");
const { HOSTAGE_RESCUE_REPORT_ID } = require("./definitions/hostage-rescue");
const {
  AIRCRAFT_CARRIER_DEFENSE_REPORT_ID,
} = require("./definitions/aircraft-carrier-defense");
const { SUPPLY_REPORT_ID } = require("./definitions/supply");
const { PATROL_REPORT_ID } = require("./definitions/patrol");
const { DUTY_REPORT_ID } = require("./definitions/duty");
const { RAID_REPORT_ID } = require("./definitions/raid");
const { PURCHASE_REPORT_ID } = require("./definitions/purchase");
const { BUSINESS_DEFENSE_REPORT_ID } = require("./definitions/business-defense");
const { RP_ACTIVITY_REPORT_ID } = require("./definitions/rp-activity");
const { AGITATION_REPORT_ID } = require("./definitions/agitation");
const { HIRING_REPORT_ID } = require("./definitions/hiring");
const { VRU_REPORT_ID } = require("./definitions/vru");
const { SS_CREATION_REPORT_ID } = require("./definitions/ss-creation");
const { EXAMS_REPORT_ID } = require("./definitions/exams");
const { PLANE_CRASH_REPORT_ID } = require("./definitions/plane-crash");

// 🔧 ЛИСТ
const SHEET_NAME = "'Преміальні'";

// 🔧 РЯДКИ
const START_ROW = 6;
const END_ROW = 53;

// 🔥 ГОЛОВНА МАПА (❗ прибрав всі || 0)
const COLUMN_MAP = {
  [VEHICLE_ACTIVITY_REPORT_ID]: { column: "D" }, // Угонка/SOT W/Фургон
  [ARREST_REPORT_ID]: { column: "E" }, // Арешт

  [`${INTERROGATION_REPORT_ID}_conducted`]: {
    column: "F", // Проведення допиту
    getValue: (c) => c[INTERROGATION_REPORT_ID]?.conducted,
  },

  [`${INTERROGATION_REPORT_ID}_participated`]: {
    column: "G", // Участь в допиті
    getValue: (c) => c[INTERROGATION_REPORT_ID]?.participated,
  },

  [SEARCH_REPORT_ID]: { column: "H" }, // Обшук

  [`${NEGOTIATION_REPORT_ID}_controlled`]: {
    column: "I", // Участь в організації та контролі перемовин
    getValue: (c) => c[NEGOTIATION_REPORT_ID]?.controlled,
  },

  [`${NEGOTIATION_REPORT_ID}_conducted`]: {
    column: "J", // Проведення перемовин
    getValue: (c) => c[NEGOTIATION_REPORT_ID]?.conducted,
  },

  [`${TRUCK_BATTLE_REPORT_ID}_failed`]: {
    column: "K", // Неуспішне БЗВ
    getValue: (c) => c[TRUCK_BATTLE_REPORT_ID]?.failed,
  },

  [`${TRUCK_BATTLE_REPORT_ID}_successful`]: {
    column: "L", // Успішне БЗВ
    getValue: (c) => c[TRUCK_BATTLE_REPORT_ID]?.successful,
  },

  [`${HOSTAGE_RESCUE_REPORT_ID}_failed`]: {
    column: "M", // Неуспішне ВЗХ
    getValue: (c) => c[HOSTAGE_RESCUE_REPORT_ID]?.failed,
  },

  [`${HOSTAGE_RESCUE_REPORT_ID}_successful`]: {
    column: "N", // Успішне ВЗХ
    getValue: (c) => c[HOSTAGE_RESCUE_REPORT_ID]?.successful,
  },

  [AIRCRAFT_CARRIER_DEFENSE_REPORT_ID]: { column: "O" }, // ФЗ/ЗАХИСТ АВІАНОСЦЯ
  [SUPPLY_REPORT_ID]: { column: "P" }, // Постачання
  [PATROL_REPORT_ID]: { column: "Q" }, // Патруль

  [`${PLANE_CRASH_REPORT_ID}_participation`]: {
    column: "R", // Крах літака (участь)
    getValue: (c) => c[PLANE_CRASH_REPORT_ID]?.participation,
  },

  [`${PLANE_CRASH_REPORT_ID}_boxes`]: {
    column: "S", // Крах літака (ящики)
    getValue: (c) => c[PLANE_CRASH_REPORT_ID]?.boxes,
  },

  [DUTY_REPORT_ID]: { column: "T" }, // Чергування

  // УВАГА: RAID не U, а X
  [RAID_REPORT_ID]: { column: "X" }, // Рейд

  // УВАГА: PURCHASE не V, а Y
  [PURCHASE_REPORT_ID]: { column: "Y" }, // Участь в закупці

  [BUSINESS_DEFENSE_REPORT_ID]: { column: "AE" }, // Участь у відбитті бізнесу
  [RP_ACTIVITY_REPORT_ID]: { column: "AF" }, // РП активність
  [AGITATION_REPORT_ID]: { column: "AG" }, // Агітація громадян (держ. хвиля)
  [HIRING_REPORT_ID]: { column: "AH" }, // Прийняття працівника
  [VRU_REPORT_ID]: { column: "AI" }, // Участь у ВРУ
  [SS_CREATION_REPORT_ID]: { column: "AJ" }, // Створення СС-К/І
  [EXAMS_REPORT_ID]: { column: "AK" }, // Проведення іспитів
};

async function runWeeklyReports({
  client,
  reports = REPORT_DEFINITIONS,
  now = () => new Date(),
  logger = console,
  writeRows = writeSheetRows,
} = {}) {
  const referenceDate = now();
  const period = getCurrentReportPeriod(referenceDate);

  const results = [];

  for (const report of reports) {
    const collectedReport = await collectReport({
      client,
      report,
      now: () => referenceDate,
      logger,
    });

    results.push(collectedReport);
  }

  const data = await buildWeeklySummaryMap(results, { client });

  // 🔥 ОЧИЩЕННЯ
  await writeRows({
    range: `${SHEET_NAME}!D${START_ROW}:AH${END_ROW}`,
    rows: [],
  });

  await writeColumns(data, { writeRows });

  return Object.freeze({
    period,
    reports: results,
  });
}

async function buildWeeklySummaryMap(reports, { client } = {}) {
  const countsByUserId = new Map();

  for (const report of reports) {
    for (const participant of report?.result?.participants || []) {
      const userCounts = countsByUserId.get(participant.userId) || {};
      userCounts[report.reportId] = participant.count;
      countsByUserId.set(participant.userId, userCounts);
    }
  }

  const participantsWithNames = await resolveReportUserNames(
    Array.from(countsByUserId.keys()).map((userId) => ({
      count: 0,
      userId,
    })),
    { client }
  );

  return participantsWithNames.map((participant) => ({
    userId: participant.userId,
    name: participant.name,
    counts: countsByUserId.get(participant.userId) || {},
  }));
}

async function writeColumns(data, { writeRows }) {
  const rowCount = END_ROW - START_ROW + 1;

  const paddedData = [];

  for (let i = 0; i < rowCount; i++) {
    paddedData.push(data[i] || { name: "", counts: {} });
  }

  // 🔥 ІНІЦІАЛИ
  await writeRows({
    range: `${SHEET_NAME}!C${START_ROW}:C${END_ROW}`,
    rows: paddedData.map((u) => [u.name || ""]),
  });

  // 🔥 КОЛОНКИ (❗ ключова правка тут)
  for (const [key, config] of Object.entries(COLUMN_MAP)) {
    if (!config || !config.column) continue;

    await writeRows({
      range: `${SHEET_NAME}!${config.column}${START_ROW}:${config.column}${END_ROW}`,
      rows: paddedData.map((u) => {
        let value = config.getValue
          ? config.getValue(u.counts)
          : u.counts[key];

        // 🔥 НЕ ПИСАТИ НУЛІ
        if (value === 0 || value === undefined || value === null) {
          return [""];
        }

        return [value];
      }),
    });
  }
}

module.exports = {
  runWeeklyReports,
};
