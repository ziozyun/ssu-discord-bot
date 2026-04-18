const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const { createLogger } = require("../logger");
const { readSheetRows } = require("../reports/sheets");
const { normalizeName } = require("../reports/user-names");
const { createUserInfoStore } = require("../users/store");

const ACTIVITY_RATING_COMMAND_NAME = "рейтинг_активності";
const ACTIVITY_RATING_LIMIT_OPTION_NAME = "кількість";
const DEFAULT_ACTIVITY_RATING_LIMIT = 10;
const MAX_ACTIVITY_RATING_LIMIT = 48;
const PREMIUMS_SHEET_NAME = "'Преміальні'";
const ACTIVITY_RATING_RANGE = `${PREMIUMS_SHEET_NAME}!AP6:AS53`;
const NAME_COLUMN_INDEX = 0;
const BONUS_COLUMN_INDEX = 3;
const DEFAULT_LOGGER = createLogger("commands");

const ACTIVITY_RATING_COMMAND = Object.freeze({
  name: ACTIVITY_RATING_COMMAND_NAME,
  description: "Показати рейтинг активності за сумою премії.",
  options: Object.freeze([
    Object.freeze({
      name: ACTIVITY_RATING_LIMIT_OPTION_NAME,
      description: "Скільки перших місць показати. За замовчуванням 10.",
      type: ApplicationCommandOptionType.Integer,
      required: false,
      min_value: 1,
      max_value: MAX_ACTIVITY_RATING_LIMIT,
    }),
  ]),
});

async function handleActivityRatingCommandInteraction(
  interaction,
  {
    logger = DEFAULT_LOGGER,
    readRows = readSheetRows,
    store = createUserInfoStore(),
  } = {},
) {
  if (!interaction.isChatInputCommand() || interaction.commandName !== ACTIVITY_RATING_COMMAND_NAME) {
    return false;
  }

  try {
    await interaction.deferReply();

    const limit = normalizeLimit(interaction.options.getInteger(ACTIVITY_RATING_LIMIT_OPTION_NAME));
    const rating = await buildActivityRating({ client: interaction.client, limit, readRows, store });

    await interaction.editReply(buildActivityRatingResponse(rating, { limit }));
  } catch (error) {
    logger.error(`[commands] Не вдалося виконати /${ACTIVITY_RATING_COMMAND_NAME}.`, error);
    await replyWithActivityRatingError(interaction);
  }

  return true;
}

async function buildActivityRating({
  client,
  limit = DEFAULT_ACTIVITY_RATING_LIMIT,
  readRows = readSheetRows,
  store = createUserInfoStore(),
} = {}) {
  const rows = await readRows({ range: ACTIVITY_RATING_RANGE });
  const userNameCandidates = await buildUserNameCandidates({ client, store });

  return rows
    .map((row, index) => {
      const name = normalizeName(row[NAME_COLUMN_INDEX]);
      const bonus = parseBonusAmount(row[BONUS_COLUMN_INDEX]);

      return {
        bonus,
        name,
        rowNumber: index + 6,
        userId: resolveUserIdByName(name, userNameCandidates),
      };
    })
    .filter((entry) => entry.name && entry.bonus > 0)
    .sort((left, right) => right.bonus - left.bonus || left.name.localeCompare(right.name, "uk", { sensitivity: "base" }))
    .slice(0, limit);
}

async function buildUserNameCandidates({ client, store }) {
  const userData = await store.readAll();
  const candidates = [];

  for (const [userId, info] of Object.entries(userData)) {
    addUserNameCandidate(candidates, info?.initials, userId);
  }

  for (const member of await fetchGuildMembers(client)) {
    addUserNameCandidate(candidates, member?.displayName, member?.id);
    addUserNameCandidate(candidates, member?.nickname, member?.id);
    addUserNameCandidate(candidates, member?.user?.globalName, member?.id);
    addUserNameCandidate(candidates, member?.user?.displayName, member?.id);
    addUserNameCandidate(candidates, member?.user?.username, member?.id);
  }

  return candidates;
}

async function fetchGuildMembers(client) {
  if (!client?.guilds) {
    return [];
  }

  const guilds = await getCandidateGuilds(client);
  const members = [];

  for (const guild of guilds) {
    if (guild?.members?.fetch) {
      try {
        const fetchedMembers = await guild.members.fetch();
        members.push(...fetchedMembers.values());
        continue;
      } catch {
        // If Discord refuses a full fetch, use whatever is already cached.
      }
    }

    if (guild?.members?.cache?.values) {
      members.push(...guild.members.cache.values());
    }
  }

  return members;
}

async function getCandidateGuilds(client) {
  const guildId = process.env.DISCORD_GUILD_ID;

  if (guildId && client.guilds.fetch) {
    try {
      return [await client.guilds.fetch(guildId)];
    } catch {
      return [];
    }
  }

  if (client.guilds.cache?.values) {
    return Array.from(client.guilds.cache.values());
  }

  return [];
}

function addUserNameCandidate(candidates, name, userId) {
  const normalizedName = normalizeName(name);

  if (normalizedName && userId) {
    candidates.push({
      key: getNameKey(normalizedName),
      parts: getNameParts(normalizedName),
      userId,
    });
  }
}

function resolveUserIdByName(name, candidates) {
  const key = getNameKey(name);

  if (!key) {
    return null;
  }

  const parts = getNameParts(name);
  const matches = candidates
    .map((candidate) => ({
      score: getNameMatchScore({ key, parts }, candidate),
      userId: candidate.userId,
    }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!matches.length) {
    return null;
  }

  const bestScore = matches[0].score;
  const bestUserIds = Array.from(new Set(matches
    .filter((match) => match.score === bestScore)
    .map((match) => match.userId)));

  return bestUserIds.length === 1 ? bestUserIds[0] : null;
}

function getNameMatchScore(source, candidate) {
  if (source.key === candidate.key) {
    return 100;
  }

  if (candidate.key.includes(source.key)) {
    return 80;
  }

  if (source.key.includes(candidate.key)) {
    return 70;
  }

  const sourcePartsInCandidate = source.parts.filter((part) => candidate.parts.includes(part)).length;
  const candidatePartsInSource = candidate.parts.filter((part) => source.parts.includes(part)).length;
  const requiredParts = Math.min(source.parts.length, candidate.parts.length);

  if (requiredParts >= 2 && sourcePartsInCandidate >= requiredParts) {
    return 60 + sourcePartsInCandidate;
  }

  if (requiredParts >= 2 && candidatePartsInSource >= requiredParts) {
    return 50 + candidatePartsInSource;
  }

  return 0;
}

function buildActivityRatingResponse(rating, { limit = DEFAULT_ACTIVITY_RATING_LIMIT } = {}) {
  const embed = new EmbedBuilder()
    .setTitle("Рейтинг активності")
    .setColor(0x2f80ed);

  if (!rating.length) {
    embed.setDescription("Немає записів із премією для рейтингу.");
  } else {
    embed
      .setDescription(rating.map(formatRatingEntry).join("\n"))
      .setFooter({ text: `Топ ${limit} за сумою премії` });
  }

  return {
    allowedMentions: {
      users: [],
    },
    embeds: [embed],
  };
}

function formatRatingEntry(entry, index) {
  return [
    `**${index + 1}.**`,
    formatRatingName(entry),
    "-",
    `${formatBonusAmount(entry.bonus)} грн.`,
  ].join(" ");
}

function formatRatingName(entry) {
  if (entry.userId) {
    return `<@${entry.userId}>`;
  }

  return entry.name;
}

function parseBonusAmount(value) {
  const digits = String(value || "").replace(/[^\d]/g, "");

  return digits ? Number(digits) : 0;
}

function formatBonusAmount(value) {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeLimit(value) {
  const limit = Number(value) || DEFAULT_ACTIVITY_RATING_LIMIT;

  return Math.min(Math.max(Math.trunc(limit), 1), MAX_ACTIVITY_RATING_LIMIT);
}

function getNameKey(name) {
  return normalizeName(name)
    .toLocaleLowerCase("uk")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNameParts(name) {
  return getNameKey(name)
    .split(" ")
    .filter((part) => part.length >= 2);
}

async function replyWithActivityRatingError(interaction) {
  const response = {
    content: "Не вдалося сформувати рейтинг активності.",
  };

  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(response);
    return;
  }

  await interaction.reply(response);
}

module.exports = {
  ACTIVITY_RATING_COMMAND,
  ACTIVITY_RATING_COMMAND_NAME,
  ACTIVITY_RATING_LIMIT_OPTION_NAME,
  buildActivityRating,
  buildActivityRatingResponse,
  handleActivityRatingCommandInteraction,
  parseBonusAmount,
};
