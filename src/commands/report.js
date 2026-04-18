const { EmbedBuilder, MessageFlags } = require("discord.js");
const { createLogger } = require("../logger");
const { runWeeklyReports } = require("../reports/weekly");

const DEFAULT_LOGGER = createLogger("commands");
const REPORT_COMMAND_NAME = "звіт";

const REPORT_COMMAND = Object.freeze({
  name: REPORT_COMMAND_NAME,
  description: "Сформувати тижневий звіт.",
});

async function handleReportCommandInteraction(
  interaction,
  {
    logger = DEFAULT_LOGGER,
    now = () => new Date(),
    runReports = runWeeklyReports,
  } = {},
) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== REPORT_COMMAND_NAME) {
    return false;
  }

  try {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const summary = await runReports({
      client: interaction.client,
      now,
      logger,
    });

    await interaction.editReply(buildReportCommandResponse(summary));
  } catch (error) {
    logger.error(`[commands] Не вдалося виконати /${REPORT_COMMAND_NAME}.`, error);
    await replyWithReportError(interaction);
  }

  return true;
}

function buildReportCommandResponse(summary) {
  const embed = new EmbedBuilder()
    .setTitle("Тижневий звіт")
    .setColor(0x2f80ed)
    .setDescription(formatReportPeriod(summary.period));

  if (!summary.reports.length) {
    embed.addFields({
      name: "Статус",
      value: "Поки не налаштовано жодного типу звіту для обробки.",
    });
  } else {
    // 🔥 формуємо поля
    const fields = summary.reports.map((report) => ({
      name: `📊 ${report.reportId}`,
      value: formatReportResult(report),
      inline: true,
    }));

    // 🔥 щоб завжди було рівно 2 в ряд
    if (fields.length % 2 !== 0) {
      fields.push({
        name: "\u200B",
        value: "\u200B",
        inline: true,
      });
    }

    embed.addFields(fields);
  }

  return {
    embeds: [embed],
  };
}

function formatReportResult(report) {
  const participantCount = report.result?.participants?.length ?? 0;

  return [
    `Повідомлень: ${report.messages.length}`,
    `Учасників: ${participantCount}`,
  ].join("\n");
}

function formatReportPeriod(period) {
  return `Період: ${formatDateTime(period.startDate)} - ${formatDateTime(period.endDate)}`;
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    timeZone: process.env.TZ || "Europe/Kyiv",
    year: "numeric",
  }).format(date);
}

async function replyWithReportError(interaction) {
  const response = {
    content: "Не вдалося сформувати тижневий звіт.",
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(response);
    return;
  }

  await interaction.reply(response);
}

module.exports = {
  REPORT_COMMAND,
  REPORT_COMMAND_NAME,
  buildReportCommandResponse,
  formatReportResult,
  handleReportCommandInteraction,
};
