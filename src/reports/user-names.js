const { createUserInfoStore } = require("../users/store");

async function resolveReportUserNames(participants, { client, store = createUserInfoStore() } = {}) {
  const userData = await store.readAll();
  const rows = [];

  for (const participant of participants) {
    rows.push({
      ...participant,
      name: await resolveReportUserName(participant.userId, { client, userData }),
    });
  }

  return rows.sort((left, right) => compareReportNames(left.name, right.name));
}

async function resolveReportUserName(userId, { client, userData = {} } = {}) {
  const initials = normalizeName(userData[userId]?.initials);

  if (initials) {
    return initials;
  }

  const member = await fetchDiscordMember(userId, client);

  if (member) {
    return normalizeName(member.displayName) ||
      normalizeName(member.nickname) ||
      normalizeName(member.user?.globalName) ||
      normalizeName(member.user?.username) ||
      userId;
  }

  const user = await fetchDiscordUser(userId, client);

  return normalizeName(user?.displayName) ||
    normalizeName(user?.globalName) ||
    normalizeName(user?.username) ||
    userId;
}

async function fetchDiscordMember(userId, client) {
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!client?.guilds) {
    return null;
  }

  const guilds = await getCandidateGuilds(client, guildId);

  for (const guild of guilds) {
    try {
      return await guild.members.fetch(userId);
    } catch {
      // Try the next known guild before falling back to the global Discord user.
    }
  }

  return null;
}

async function getCandidateGuilds(client, guildId) {
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

async function fetchDiscordUser(userId, client) {
  if (!client?.users?.fetch) {
    return null;
  }

  try {
    return await client.users.fetch(userId);
  } catch {
    return null;
  }
}

function formatVehicleActivityRows(participantsWithNames) {
  return participantsWithNames.map((participant) => [participant.name, participant.count]);
}

function compareReportNames(left, right) {
  return left.localeCompare(right, "uk", { sensitivity: "base" });
}

function normalizeName(value) {
  return String(value || "")
    .trim()
    .replace(/\[[^\]]*\]\s*/gu, "")
    .replace(/\s+/g, " ");
}

module.exports = {
  compareReportNames,
  formatVehicleActivityRows,
  fetchDiscordMember,
  getCandidateGuilds,
  normalizeName,
  resolveReportUserName,
  resolveReportUserNames,
};
