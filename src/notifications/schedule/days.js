const WEEK_DAYS = Object.freeze({
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
});

function getIsoWeekDay(date) {
  const weekDay = date.getDay();

  return weekDay === 0 ? WEEK_DAYS.SUNDAY : weekDay;
}

function assertIsoWeekDay(day) {
  if (!Number.isInteger(day) || day < WEEK_DAYS.MONDAY || day > WEEK_DAYS.SUNDAY) {
    throw new Error(`Некоректний день тижня для розкладу: ${day}`);
  }
}

module.exports = {
  WEEK_DAYS,
  assertIsoWeekDay,
  getIsoWeekDay,
};
