const { Events } = require("discord.js");
const { createLogger } = require("../logger");
const { REPORT_DEFINITIONS } = require("./definitions");
const { runWeeklyReports } = require("./weekly");

const MINUTE_IN_MS = 60 * 1000;
const DEFAULT_REPORT_AUTO_RUN_DELAY_MINUTES = 5;
const DEFAULT_LOGGER = createLogger("reports");

function startWeeklyReportAutoRunner({
  client,
  delayMinutes = getReportAutoRunDelayMinutes(),
  logger = DEFAULT_LOGGER,
  reports = REPORT_DEFINITIONS,
  runReports = runWeeklyReports,
} = {}) {
  if (!client) {
    throw new Error("Немає Discord client для автоматичного запуску звітів.");
  }

  const reportChannelIds = getReportChannelIds(reports);
  const delayMs = delayMinutes * MINUTE_IN_MS;
  let isRunning = false;
  let timer = null;

  async function runOnce() {
    timer = null;

    if (isRunning) {
      logger.warn?.("[reports] Попередній автоматичний запуск ще триває, запланую повторний перерахунок.");
      scheduleRun();
      return;
    }

    isRunning = true;

    try {
      logger.info?.("[reports] Починаю автоматичне формування тижневого звіту.");
      await runReports({ client, logger });
      logger.info?.("[reports] Автоматичне формування тижневого звіту завершено.");
    } catch (error) {
      logger.error?.("[reports] Не вдалося автоматично сформувати тижневий звіт.", error);
    } finally {
      isRunning = false;
    }
  }

  function scheduleRun(reason) {
    const hadPendingRun = Boolean(timer);

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(runOnce, delayMs);

    logger.info?.(
      hadPendingRun
        ? `[reports] Перерахунок переплановано: ${reason}. Чекаю ${delayMinutes} хв. тиші.`
        : `[reports] Перерахунок заплановано: ${reason}. Запуск через ${delayMinutes} хв. тиші.`,
    );
  }

  function handleMessageCreate(message) {
    if (message?.author?.bot || !reportChannelIds.has(message?.channelId)) {
      return;
    }

    scheduleRun(`нове повідомлення ${message.id || "без id"} у каналі ${message.channelId}`);
  }

  async function handleMessageReactionAdd(reaction, user) {
    if (user?.bot) {
      return;
    }

    const channelId = await getReactionChannelId(reaction);

    if (reportChannelIds.has(channelId)) {
      scheduleRun(`нова реакція ${formatReactionName(reaction)} від ${user.id} у каналі ${channelId}`);
    }
  }

  async function handleMessageReactionRemove(reaction, user) {
    if (user?.bot) {
      return;
    }

    const channelId = await getReactionChannelId(reaction);

    if (reportChannelIds.has(channelId)) {
      scheduleRun(`прибрано реакцію ${formatReactionName(reaction)} від ${user.id} у каналі ${channelId}`);
    }
  }

  client.on(Events.MessageCreate, handleMessageCreate);
  client.on(Events.MessageReactionAdd, handleMessageReactionAdd);
  client.on(Events.MessageReactionRemove, handleMessageReactionRemove);

  logger.info?.(`[reports] Автоматичне формування звітів увімкнено після ${delayMinutes} хв. тиші у звітних каналах.`);
  logger.info?.(`[reports] Відстежується звітних каналів: ${reportChannelIds.size}.`);

  return {
    runOnce,
    scheduleRun,
    stop: () => {
      if (timer) {
        clearTimeout(timer);
      }

      client.off(Events.MessageCreate, handleMessageCreate);
      client.off(Events.MessageReactionAdd, handleMessageReactionAdd);
      client.off(Events.MessageReactionRemove, handleMessageReactionRemove);
    },
  };
}

function getReportChannelIds(reports) {
  return new Set(
    reports
      .flatMap((report) => report.channelIds || [])
      .filter(Boolean),
  );
}

async function getReactionChannelId(reaction) {
  if (reaction?.message?.channelId) {
    return reaction.message.channelId;
  }

  if (reaction?.partial && reaction.fetch) {
    try {
      const fetchedReaction = await reaction.fetch();
      return fetchedReaction?.message?.channelId || null;
    } catch {
      return null;
    }
  }

  return null;
}

function formatReactionName(reaction) {
  return reaction?.emoji?.name || String(reaction?.emoji || "без назви");
}

function getReportAutoRunDelayMinutes(value = process.env.REPORT_AUTO_RUN_DELAY_MINUTES) {
  const delay = Number(value);

  if (!Number.isFinite(delay) || delay <= 0) {
    return DEFAULT_REPORT_AUTO_RUN_DELAY_MINUTES;
  }

  return delay;
}

module.exports = {
  DEFAULT_REPORT_AUTO_RUN_DELAY_MINUTES,
  getReportAutoRunDelayMinutes,
  startWeeklyReportAutoRunner,
};
