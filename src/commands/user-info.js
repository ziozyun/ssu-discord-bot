const { ApplicationCommandOptionType, EmbedBuilder, MessageFlags, PermissionsBitField } = require("discord.js");
const { createUserInfoStore } = require("../users/store");

const CARD_NUMBER_COMMAND_NAME = "номер_карти";
const INITIALS_COMMAND_NAME = "ініціали";
const MY_INFO_COMMAND_NAME = "інформація_про_мене";
const CARD_NUMBER_OPTION_NAME = "номер";
const INITIALS_OPTION_NAME = "значення";
const USER_OPTION_NAME = "користувач";
const CARD_NUMBER_PATTERN = /^\d{4}-\d{4}$/;
const INITIALS_PATTERN = /^[\p{L}][\p{L}.'’ -]{0,62}\p{L}\.?$/u;

const CARD_NUMBER_COMMAND = Object.freeze({
  name: CARD_NUMBER_COMMAND_NAME,
  description: "Зберегти номер картки користувача.",
  options: Object.freeze([
    Object.freeze({
      name: CARD_NUMBER_OPTION_NAME,
      description: "Номер у форматі 1111-1111.",
      type: ApplicationCommandOptionType.String,
      required: true,
    }),
    Object.freeze({
      name: USER_OPTION_NAME,
      description: "Користувач, для якого треба зберегти номер.",
      type: ApplicationCommandOptionType.User,
      required: false,
    }),
  ]),
});

const INITIALS_COMMAND = Object.freeze({
  name: INITIALS_COMMAND_NAME,
  description: "Зберегти ініціали користувача.",
  options: Object.freeze([
    Object.freeze({
      name: INITIALS_OPTION_NAME,
      description: "Наприклад: Ihor Burevii.",
      type: ApplicationCommandOptionType.String,
      required: true,
    }),
    Object.freeze({
      name: USER_OPTION_NAME,
      description: "Користувач, для якого треба зберегти ініціали.",
      type: ApplicationCommandOptionType.User,
      required: false,
    }),
  ]),
});

const MY_INFO_COMMAND = Object.freeze({
  name: MY_INFO_COMMAND_NAME,
  description: "Показати збережену інформацію про себе.",
});

const USER_INFO_COMMANDS = Object.freeze([CARD_NUMBER_COMMAND, INITIALS_COMMAND, MY_INFO_COMMAND]);

async function handleUserInfoCommandInteraction(
  interaction,
  {
    logger = console,
    store = createUserInfoStore(),
    adminRoleId = process.env.USER_DATA_ADMIN_ROLE_ID,
    now = () => new Date(),
  } = {},
) {
  if (!interaction.isChatInputCommand() || !isUserInfoCommand(interaction.commandName)) {
    return false;
  }

  try {
    if (interaction.commandName === CARD_NUMBER_COMMAND_NAME) {
      await handleCardNumberCommand(interaction, { adminRoleId, now, store });
      return true;
    }

    if (interaction.commandName === INITIALS_COMMAND_NAME) {
      await handleInitialsCommand(interaction, { adminRoleId, now, store });
      return true;
    }

    await handleMyInfoCommand(interaction, { store });
  } catch (error) {
    logger.error(`[commands] Не вдалося виконати /${interaction.commandName}.`, error);
    await replyWithUserInfoError(interaction);
  }

  return true;
}

async function handleCardNumberCommand(interaction, { adminRoleId, now, store }) {
  const targetUser = getTargetUser(interaction);
  const permissionError = getTargetPermissionError(interaction, targetUser, adminRoleId);

  if (permissionError) {
    await replyEphemeral(interaction, permissionError);
    return;
  }

  const cardNumber = String(interaction.options.getString(CARD_NUMBER_OPTION_NAME) || "").trim();

  if (!CARD_NUMBER_PATTERN.test(cardNumber)) {
    await replyEphemeral(interaction, "Номер картки має бути у форматі `1111-1111`.");
    return;
  }

  await store.updateUser(targetUser.id, { cardNumber }, { now: now() });
  await replyEphemeral(interaction, `Номер картки збережено для ${formatUser(targetUser)}.`);
}

async function handleInitialsCommand(interaction, { adminRoleId, now, store }) {
  const targetUser = getTargetUser(interaction);
  const permissionError = getTargetPermissionError(interaction, targetUser, adminRoleId);

  if (permissionError) {
    await replyEphemeral(interaction, permissionError);
    return;
  }

  const initials = normalizeInitials(interaction.options.getString(INITIALS_OPTION_NAME));

  if (!isValidInitials(initials)) {
    await replyEphemeral(interaction, "Ініціали мають бути текстом від 2 до 64 символів. Наприклад: `Ihor Burevii`.");
    return;
  }

  await store.updateUser(targetUser.id, { initials }, { now: now() });
  await replyEphemeral(interaction, `Ініціали збережено для ${formatUser(targetUser)}.`);
}

async function handleMyInfoCommand(interaction, { store }) {
  const userInfo = await store.getUser(interaction.user.id);
  const embed = new EmbedBuilder()
    .setTitle("Інформація про мене")
    .setColor(0x2f80ed)
    .addFields(
      {
        name: "Ініціали",
        value: userInfo.initials || "Не вказано.",
      },
      {
        name: "Номер картки",
        value: userInfo.cardNumber || "Не вказано.",
      },
    );

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
}

function isUserInfoCommand(commandName) {
  return commandName === CARD_NUMBER_COMMAND_NAME || commandName === INITIALS_COMMAND_NAME || commandName === MY_INFO_COMMAND_NAME;
}

function getTargetUser(interaction) {
  return interaction.options.getUser(USER_OPTION_NAME) || interaction.user;
}

function getTargetPermissionError(interaction, targetUser, adminRoleId) {
  if (targetUser.id === interaction.user.id) {
    return null;
  }

  if (canManageOtherUsers(interaction, adminRoleId)) {
    return null;
  }

  return "Можна змінювати чужу інформацію тільки з правами адміністратора.";
}

function canManageOtherUsers(interaction, adminRoleId) {
  if (adminRoleId && interaction.member?.roles?.cache?.has(adminRoleId)) {
    return true;
  }

  return Boolean(
    interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ||
      interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator),
  );
}

function normalizeInitials(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidInitials(initials) {
  return initials.length >= 2 && initials.length <= 64 && INITIALS_PATTERN.test(initials);
}

function formatUser(user) {
  return `<@${user.id}>`;
}

async function replyEphemeral(interaction, content) {
  await interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

async function replyWithUserInfoError(interaction) {
  const response = {
    content: "Не вдалося обробити інформацію користувача.",
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.followUp(response);
    return;
  }

  await interaction.reply(response);
}

module.exports = {
  CARD_NUMBER_COMMAND_NAME,
  INITIALS_COMMAND_NAME,
  MY_INFO_COMMAND_NAME,
  USER_INFO_COMMANDS,
  handleUserInfoCommandInteraction,
  isValidInitials,
  normalizeInitials,
};
