function getMessageParticipantIds(message) {
  const participantIds = new Set();

  if (message?.author?.id && !message.author.bot) {
    participantIds.add(message.author.id);
  }

  for (const userId of getMentionedUserIds(message)) {
    participantIds.add(userId);
  }

  return Array.from(participantIds);
}

function countMessageParticipants(messages) {
  const counts = new Map();

  for (const message of messages) {
    for (const userId of getMessageParticipantIds(message)) {
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

module.exports = {
  countMessageParticipants,
  getMessageParticipantIds,
};
