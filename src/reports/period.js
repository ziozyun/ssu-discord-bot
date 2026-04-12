const { getIsoWeekDay } = require("../notifications/schedule/days");

function getCurrentReportPeriod(referenceDate = new Date()) {
  const startDate = new Date(referenceDate);
  const isoWeekDay = getIsoWeekDay(startDate);

  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - isoWeekDay + 1);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return Object.freeze({
    startDate,
    endDate,
  });
}

function isDateInReportPeriod(date, period) {
  const timestamp = date.getTime();

  return timestamp >= period.startDate.getTime() && timestamp <= period.endDate.getTime();
}

module.exports = {
  getCurrentReportPeriod,
  isDateInReportPeriod,
};
