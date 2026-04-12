const { getIsoWeekDay } = require("../notifications/schedule/days");

function getCurrentReportPeriod(referenceDate = new Date()) {
  const adjustedDate = new Date(referenceDate);

  const isoWeekDay = getIsoWeekDay(adjustedDate);
  const hour = adjustedDate.getHours();

  // 🔥 ХАК: якщо понеділок і до 06:00 → відкотитися на день назад (в неділю)
  if (isoWeekDay === 1 && hour < 6) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }

  const startDate = new Date(adjustedDate);
  const finalIsoWeekDay = getIsoWeekDay(startDate);

  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - finalIsoWeekDay + 1);

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

  return (
    timestamp >= period.startDate.getTime() &&
    timestamp <= period.endDate.getTime()
  );
}

module.exports = {
  getCurrentReportPeriod,
  isDateInReportPeriod,
};
