const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const {
  NOTIFICATION_LEAD_TIME_MINUTES,
  WEEKLY_NOTIFICATION_SCHEDULE,
  normalizeWeeklySchedule,
} = require("../notifications/schedule");
const { WEEK_DAYS, getIsoWeekDay } = require("../notifications/schedule/days");

const PODII_COMMAND_NAME = "події";
const PODII_DAY_OPTION_NAME = "день";
const OPERATIONAL_DAY_START_HOUR = 6;
const EVENT_DEFINITIONS = Object.freeze({
  "hammer-war": Object.freeze({
    title: "Війна за Hammer",
    details: ({ hummerTime, notificationTime }) => [
      `Повідомлення: ${notificationTime}`,
      `Hummer: ${hummerTime}`,
    ],
  }),
  "truck-battle": Object.freeze({
    title: "Битва за вантажівку",
    details: ({ notificationTime }) => [`Повідомлення: ${notificationTime}`],
  }),
  "plane-crash": Object.freeze({
    title: "Падіння військового літака",
    details: ({ notificationTime }) => [`Повідомлення: ${notificationTime}`],
  }),
});
const DAY_CHOICES = Object.freeze([
  Object.freeze({ name: "сьогодні", value: "today" }),
  Object.freeze({ name: "завтра", value: "tomorrow" }),
  Object.freeze({ name: "понеділок", value: "monday" }),
  Object.freeze({ name: "вівторок", value: "tuesday" }),
  Object.freeze({ name: "середа", value: "wednesday" }),
  Object.freeze({ name: "четвер", value: "thursday" }),
  Object.freeze({ name: "п'ятниця", value: "friday" }),
  Object.freeze({ name: "субота", value: "saturday" }),
  Object.freeze({ name: "неділя", value: "sunday" }),
]);
const WEEK_DAY_OPTIONS = Object.freeze({
  monday: WEEK_DAYS.MONDAY,
  tuesday: WEEK_DAYS.TUESDAY,
  wednesday: WEEK_DAYS.WEDNESDAY,
  thursday: WEEK_DAYS.THURSDAY,
  friday: WEEK_DAYS.FRIDAY,
  saturday: WEEK_DAYS.SATURDAY,
  sunday: WEEK_DAYS.SUNDAY,
});
const WEEK_DAY_LABELS = Object.freeze({
  [WEEK_DAYS.MONDAY]: "понеділок",
  [WEEK_DAYS.TUESDAY]: "вівторок",
  [WEEK_DAYS.WEDNESDAY]: "середа",
  [WEEK_DAYS.THURSDAY]: "четвер",
  [WEEK_DAYS.FRIDAY]: "п'ятниця",
  [WEEK_DAYS.SATURDAY]: "субота",
  [WEEK_DAYS.SUNDAY]: "неділя",
});
const DAY_OPTION_ALIASES = Object.freeze({
  сьогодні: "today",
  завтра: "tomorrow",
  понеділок: "monday",
  вівторок: "tuesday",
  середа: "wednesday",
  четвер: "thursday",
  "п'ятниця": "friday",
  пятниця: "friday",
  субота: "saturday",
  неділя: "sunday",
});

const PODII_COMMAND = Object.freeze({
  name: PODII_COMMAND_NAME,
  description: "Показати події за ігровий день.",
  options: Object.freeze([
    Object.freeze({
      name: PODII_DAY_OPTION_NAME,
      description: "Оберіть день.",
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: DAY_CHOICES,
    }),
  ]),
});

function buildEventsCommandResponse({
  dayOption = "today",
  now = new Date(),
  schedule = WEEKLY_NOTIFICATION_SCHEDULE,
} = {}) {
  const selection = resolveDaySelection(dayOption, now);
  const occurrences = getOperationalDayOccurrences(schedule, selection.startAt, selection.endAt);
  const nextOccurrence = selection.isToday
    ? occurrences.find((occurrence) => occurrence.scheduledAt.getTime() > now.getTime())
    : null;
  const embed = new EmbedBuilder()
    .setTitle(`Події на ${selection.title}`)
    .setDescription(formatOperationalDayDescription(selection))
    .setColor(0x2f80ed);

  if (selection.isToday) {
    embed.addFields({
      name: "Найближча подія",
      value: nextOccurrence
        ? formatOccurrenceBlock(nextOccurrence, selection.startAt)
        : "Сьогодні більше немає запланованих подій.",
    });
  }

  embed.addFields({
    name: "Розклад",
    value: occurrences.length
      ? occurrences.map((occurrence) => formatOccurrenceBlock(occurrence, selection.startAt)).join("\n\n")
      : "Подій немає.",
  });

  return {
    embeds: [embed],
  };
}

function resolveDaySelection(dayOption, now) {
  const normalizedDayOption = normalizeDayOption(dayOption);
  const currentOperationalDayStart = getOperationalDayStart(now);
  let startAt;
  let title;
  let isToday = false;

  if (normalizedDayOption === "today") {
    startAt = currentOperationalDayStart;
    title = "сьогодні";
    isToday = true;
  } else if (normalizedDayOption === "tomorrow") {
    startAt = addDays(currentOperationalDayStart, 1);
    title = "завтра";
  } else {
    const targetWeekDay = WEEK_DAY_OPTIONS[normalizedDayOption];
    const daysUntilTarget = (targetWeekDay - getIsoWeekDay(currentOperationalDayStart) + 7) % 7;

    startAt = addDays(currentOperationalDayStart, daysUntilTarget);
    title = WEEK_DAY_LABELS[targetWeekDay];
    isToday = daysUntilTarget === 0;
  }

  return Object.freeze({
    dayOption: normalizedDayOption,
    endAt: addDays(startAt, 1),
    isToday,
    startAt,
    title,
  });
}

function normalizeDayOption(dayOption) {
  if (!dayOption) {
    return "today";
  }

  const normalizedDayOption = String(dayOption).toLowerCase();
  const resolvedDayOption = DAY_OPTION_ALIASES[normalizedDayOption] || normalizedDayOption;

  if (resolvedDayOption === "today" || resolvedDayOption === "tomorrow" || WEEK_DAY_OPTIONS[resolvedDayOption]) {
    return resolvedDayOption;
  }

  return "today";
}

function getOperationalDayOccurrences(schedule, startAt, endAt) {
  const notifications = normalizeWeeklySchedule(schedule).filter((notification) => getEventDefinition(notification));
  const weekStart = getStartOfIsoWeek(startAt);
  const occurrences = [];

  for (const notification of notifications) {
    for (const weekOffset of [0, 1]) {
      const scheduledAt = getScheduledAt(weekStart, notification, weekOffset);

      if (scheduledAt.getTime() >= startAt.getTime() && scheduledAt.getTime() < endAt.getTime()) {
        occurrences.push(
          Object.freeze({
            event: getEventDefinition(notification),
            notification,
            notifyAt: addMinutes(scheduledAt, -NOTIFICATION_LEAD_TIME_MINUTES),
            scheduledAt,
          }),
        );
      }
    }
  }

  return occurrences.sort((firstOccurrence, secondOccurrence) => firstOccurrence.scheduledAt - secondOccurrence.scheduledAt);
}

function getEventDefinition(notification) {
  const eventId = Object.keys(EVENT_DEFINITIONS).find((id) => notification.id.startsWith(`${id}-`));

  return EVENT_DEFINITIONS[eventId] || null;
}

function formatOperationalDayDescription({ startAt, endAt }) {
  return `Ігровий день: ${formatDayWithDate(startAt)} 06:00 - ${formatDayWithDate(endAt)} 05:59`;
}

function formatOccurrenceBlock(occurrence, operationalDayStart) {
  const time = formatOccurrenceTime(occurrence.scheduledAt, operationalDayStart);
  const notificationTime = formatTime(occurrence.notifyAt);
  const details = occurrence.event.details({
    hummerTime: formatOccurrenceTime(addMinutes(occurrence.scheduledAt, 10), operationalDayStart),
    notificationTime,
  });

  return [`**${time}** - ${occurrence.event.title}`, ...details].join("\n");
}

function formatOccurrenceTime(date, operationalDayStart) {
  const suffix = isSameCalendarDay(date, operationalDayStart) ? "" : " (+1 день)";

  return `${formatTime(date)}${suffix}`;
}

function formatTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDayWithDate(date) {
  return `${WEEK_DAY_LABELS[getIsoWeekDay(date)]} ${formatDate(date)}`;
}

function formatDate(date) {
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()}`;
}

function getOperationalDayStart(date) {
  const startAt = new Date(date);

  startAt.setHours(OPERATIONAL_DAY_START_HOUR, 0, 0, 0);

  if (date.getTime() < startAt.getTime()) {
    startAt.setDate(startAt.getDate() - 1);
  }

  return startAt;
}

function getStartOfIsoWeek(date) {
  const weekStart = new Date(date);

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - getIsoWeekDay(weekStart) + 1);

  return weekStart;
}

function getScheduledAt(weekStart, notification, weekOffset) {
  const [hours, minutes] = notification.time.split(":").map(Number);
  const scheduledAt = new Date(weekStart);

  scheduledAt.setDate(scheduledAt.getDate() + notification.day - 1 + weekOffset * 7);
  scheduledAt.setHours(hours, minutes, 0, 0);

  return scheduledAt;
}

function addDays(date, daysToAdd) {
  const newDate = new Date(date);

  newDate.setDate(newDate.getDate() + daysToAdd);

  return newDate;
}

function addMinutes(date, minutesToAdd) {
  return new Date(date.getTime() + minutesToAdd * 60 * 1000);
}

function isSameCalendarDay(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

module.exports = {
  DAY_CHOICES,
  OPERATIONAL_DAY_START_HOUR,
  PODII_COMMAND,
  PODII_COMMAND_NAME,
  PODII_DAY_OPTION_NAME,
  buildEventsCommandResponse,
  getOperationalDayOccurrences,
  getOperationalDayStart,
  resolveDaySelection,
};
