const { MessageFlags } = require("discord.js");
const { createLogger } = require("../logger");
const {
  PODII_COMMAND,
  PODII_COMMAND_NAME,
  PODII_DAY_OPTION_NAME,
  buildEventsCommandResponse,
} = require("./events");
const {
  ACTIVITY_RATING_COMMAND,
  ACTIVITY_RATING_COMMAND_NAME,
  handleActivityRatingCommandInteraction,
} = require("./activity-rating");
const { REPORT_COMMAND, REPORT_COMMAND_NAME, handleReportCommandInteraction } = require("./report");
const { USER_INFO_COMMANDS, handleUserInfoCommandInteraction } = require("./user-info");

const DEFAULT_LOGGER = createLogger("commands");
const APPLICATION_COMMANDS = Object.freeze([PODII_COMMAND, REPORT_COMMAND, ACTIVITY_RATING_COMMAND, ...USER_INFO_COMMANDS]);

async function registerCommands({
  client,
  guildId = process.env.DISCORD_GUILD_ID,
  logger = DEFAULT_LOGGER,
} = {}) {
  if (!client?.application) {
    throw new Error("Немає Discord application для реєстрації команд.");
  }

  if (guildId) {
    await client.application.commands.set(APPLICATION_COMMANDS, guildId);
    logger.info(`[commands] Slash-команди зареєстровано для guild ${guildId}.`);
    return;
  }

  const guilds = Array.from(client.guilds.cache.values());

  if (!guilds.length) {
    logger.warn("[commands] Не знайдено guild для реєстрації slash-команд.");
    return;
  }

  for (const guild of guilds) {
    await guild.commands.set(APPLICATION_COMMANDS);
    logger.info(`[commands] Slash-команди зареєстровано для guild ${guild.id}.`);
  }
}

async function handleCommandInteraction(interaction, { logger = DEFAULT_LOGGER, now = () => new Date() } = {}) {
  if (!interaction.isChatInputCommand()) {
    return false;
  }

  if (interaction.commandName === REPORT_COMMAND_NAME) {
    return handleReportCommandInteraction(interaction, { logger, now });
  }

  if (interaction.commandName === ACTIVITY_RATING_COMMAND_NAME) {
    return handleActivityRatingCommandInteraction(interaction, { logger });
  }

  if (interaction.commandName !== PODII_COMMAND_NAME) {
    return handleUserInfoCommandInteraction(interaction, { logger, now });
  }

  try {
    const dayOption = interaction.options.getString(PODII_DAY_OPTION_NAME) || "today";
    const response = buildEventsCommandResponse({ dayOption, now: now() });

    await interaction.reply({
      ...response,
      flags: MessageFlags.Ephemeral,
    });
  } catch (error) {
    logger.error(`[commands] Не вдалося виконати /${PODII_COMMAND_NAME}.`, error);
    await replyWithError(interaction);
  }

  return true;
}

async function replyWithError(interaction) {
  const response = {
    content: "Не вдалося сформувати розклад подій.",
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(response);
    return;
  }

  await interaction.reply(response);
}

module.exports = {
  APPLICATION_COMMANDS,
  handleCommandInteraction,
  registerCommands,
};
