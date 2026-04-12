const { AIRCRAFT_CARRIER_DEFENSE_REPORT_ID } = require("./definitions/aircraft-carrier-defense");
const { ARREST_REPORT_ID } = require("./definitions/arrest");
const { HOSTAGE_RESCUE_REPORT_ID } = require("./definitions/hostage-rescue");
const { INTERROGATION_REPORT_ID } = require("./definitions/interrogation");
const { NEGOTIATION_REPORT_ID } = require("./definitions/negotiation");
const { PLANE_CRASH_REPORT_ID } = require("./definitions/plane-crash");
const { SEARCH_REPORT_ID } = require("./definitions/search");
const { SUPPLY_REPORT_ID } = require("./definitions/supply");
const { TRUCK_BATTLE_REPORT_ID } = require("./definitions/truck-battle");
const { VEHICLE_ACTIVITY_REPORT_ID } = require("./definitions/vehicle-activity");
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
const { resolveReportUserNames } = require("./user-names");

const REPORT_COLUMNS = Object.freeze([
  Object.freeze({
    reportId: VEHICLE_ACTIVITY_REPORT_ID,
    title: "Угонка/SOTW/Фургон",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: ARREST_REPORT_ID,
    title: "Арешт",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: INTERROGATION_REPORT_ID,
    title: "Проведення допиту",
    getValue: (count) => count?.conducted || 0,
  }),
  Object.freeze({
    reportId: INTERROGATION_REPORT_ID,
    title: "Участь в допиті",
    getValue: (count) => count?.participated || 0,
  }),
  Object.freeze({
    reportId: SEARCH_REPORT_ID,
    title: "Обшук",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: NEGOTIATION_REPORT_ID,
    title: "Участь в організації та контроль перемовин",
    getValue: (count) => count?.controlled || 0,
  }),
  Object.freeze({
    reportId: NEGOTIATION_REPORT_ID,
    title: "Проведення перемовин",
    getValue: (count) => count?.conducted || 0,
  }),
  Object.freeze({
    reportId: TRUCK_BATTLE_REPORT_ID,
    title: "Неуспішне БЗВ",
    getValue: (count) => count?.failed || 0,
  }),
  Object.freeze({
    reportId: TRUCK_BATTLE_REPORT_ID,
    title: "Успішне БЗВ",
    getValue: (count) => count?.successful || 0,
  }),
  Object.freeze({
    reportId: HOSTAGE_RESCUE_REPORT_ID,
    title: "Неуспішне ВЗХ",
    getValue: (count) => count?.failed || 0,
  }),
  Object.freeze({
    reportId: HOSTAGE_RESCUE_REPORT_ID,
    title: "Успішне ВЗХ",
    getValue: (count) => count?.successful || 0,
  }),
  Object.freeze({
    reportId: AIRCRAFT_CARRIER_DEFENSE_REPORT_ID,
    title: "ФЗ/ЗАХИСТ АВІАНОСЦЯ",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: SUPPLY_REPORT_ID,
    title: "ПОСТАЧАННЯ",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: PATROL_REPORT_ID,
    title: "Патруль",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: PLANE_CRASH_REPORT_ID,
    title: "Крах літака (участь)",
    getValue: (count) => count?.participation || 0,
  }),
  Object.freeze({
    reportId: PLANE_CRASH_REPORT_ID,
    title: "Крах літака (ящики)",
    getValue: (count) => count?.boxes || 0,
  }),
  Object.freeze({
    reportId: DUTY_REPORT_ID,
    title: "Чергування",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: RAID_REPORT_ID,
    title: "Рейд",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: PURCHASE_REPORT_ID,
    title: "Контрольна закупка",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: BUSINESS_DEFENSE_REPORT_ID,
    title: "Участь у відбитті бізнесу",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: RP_ACTIVITY_REPORT_ID,
    title: "РП активність",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: AGITATION_REPORT_ID,
    title: "Агітація громадян (держ. хвиля)",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: HIRING_REPORT_ID,
    title: "Прийняття працівника",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: VRU_REPORT_ID,
    title: "Участь у ВРУ",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: SS_CREATION_REPORT_ID,
    title: "Створення СС-ки",
    getValue: (count) => count || 0,
  }),
  Object.freeze({
    reportId: EXAMS_REPORT_ID,
    title: "Проведення іспитів",
    getValue: (count) => count || 0,
  }),
]);

async function buildWeeklySummaryRows(reports, { client } = {}) {
  const countsByUserId = new Map();

  for (const column of REPORT_COLUMNS) {
    const report = reports.find((candidate) => candidate.reportId === column.reportId);

    for (const participant of report?.result?.participants || []) {
      const userCounts = countsByUserId.get(participant.userId) || {};
      userCounts[column.reportId] = participant.count;
      countsByUserId.set(participant.userId, userCounts);
    }
  }

  const participantsWithNames = await resolveReportUserNames(
    Array.from(countsByUserId.keys()).map((userId) => ({ count: 0, userId })),
    { client },
  );

  return participantsWithNames.map((participant) => {
    const userCounts = countsByUserId.get(participant.userId) || {};

    return [
      participant.name,
      ...REPORT_COLUMNS.map((column) => column.getValue(userCounts[column.reportId])),
    ];
  });
}

function buildWeeklySummaryHeader() {
  return ["Ініціали", ...REPORT_COLUMNS.map((column) => column.title)];
}

module.exports = {
  REPORT_COLUMNS,
  buildWeeklySummaryHeader,
  buildWeeklySummaryRows,
};
