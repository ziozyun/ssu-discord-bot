const { REPORT_DEFINITIONS } = require("./definitions");
const { getCurrentReportPeriod } = require("./period");
const { collectReport } = require("./runner");
const { writeSheetRows } = require("./sheets");
const { buildWeeklySummaryHeader, buildWeeklySummaryRows } = require("./summary");

const WEEKLY_SUMMARY_TEST_RANGE = "'Тест'!A:AG";

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

  const rows = await buildWeeklySummaryRows(results, { client });
  const writeResult = await writeRows({
    range: WEEKLY_SUMMARY_TEST_RANGE,
    rows: rows.length ? [buildWeeklySummaryHeader(), ...rows] : [],
  });

  return Object.freeze({
    period,
    reports: results,
    rows,
    writeResult,
  });
}

module.exports = {
  WEEKLY_SUMMARY_TEST_RANGE,
  runWeeklyReports,
};
