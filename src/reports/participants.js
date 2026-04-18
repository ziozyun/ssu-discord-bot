const WHITE_CHECK_MARK_REACTION_NAMES = new Set(["✅", "white_check_mark"]);

async function getMessageParticipantIds(message) {
  const participantIds = new Set();

  if (message?.author?.id && !message.author.bot) {
    participantIds.add(message.author.id);
  }

  for (const userId of getMentionedUserIds(message)) {
    participantIds.add(userId);
  }

  for (const userId of await getWhiteCheckMarkReactionUserIds(message)) {
    participantIds.add(userId);
  }

  return Array.from(participantIds);
}

async function countMessageParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    for (const userId of await getMessageParticipantIds(message)) {
      counts.set(userId, (counts.get(userId) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([userId, count]) => ({ count, userId }))
    .sort((left, right) => right.count - left.count || left.userId.localeCompare(right.userId));
}

function getMentionedUserIds(message) {
  if (message?.mentions?.users?.values) {
    return Array.from(message.mentions.users.values())
      .filter((user) => !user.bot)
      .map((user) => user.id);
  }

  if (message?.mentions?.users instanceof Map) {
    return Array.from(message.mentions.users.values())
      .filter((user) => !user.bot)
      .map((user) => user.id);
  }

  return [];
}

async function getWhiteCheckMarkReactionUserIds(message) {
  const reaction = getWhiteCheckMarkReaction(message);

  if (!reaction) {
    return [];
  }

  const users = await fetchReactionUsers(reaction);

  return users
    .filter((user) => !user.bot)
    .map((user) => user.id);
}

function getWhiteCheckMarkReaction(message) {
  const reactions = message?.reactions?.cache;

  if (!reactions?.values) {
    return null;
  }

  return Array.from(reactions.values()).find((reaction) =>
    WHITE_CHECK_MARK_REACTION_NAMES.has(reaction?.emoji?.name) ||
    WHITE_CHECK_MARK_REACTION_NAMES.has(String(reaction?.emoji || "")),
  ) || null;
}

async function fetchReactionUsers(reaction) {
  if (reaction?.users?.fetch) {
    try {
      const users = await reaction.users.fetch();
      return Array.from(users.values());
    } catch {
      return getCachedReactionUsers(reaction);
    }
  }

  return getCachedReactionUsers(reaction);
}

function getCachedReactionUsers(reaction) {
  if (reaction?.users?.cache?.values) {
    return Array.from(reaction.users.cache.values());
  }

  return [];
}

module.exports = {
  countMessageParticipants,
  getMessageParticipantIds,
  getWhiteCheckMarkReactionUserIds,
};
