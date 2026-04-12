function parseScheduleTime(time) {
  if (typeof time !== "string") {
    throw new Error("Час сповіщення має бути string у форматі HH:mm.");
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);

  if (!match) {
    throw new Error(`Некоректний час сповіщення: ${time}. Очікується HH:mm.`);
  }

  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  };
}

module.exports = {
  parseScheduleTime,
};
