const assert = require("node:assert/strict");
const test = require("node:test");

const { EmbedBuilder } = require("discord.js");
const { addRoleMention, sendDiscordChannelMessage } = require(".");

const NOTIFICATION_ROLE_ID = "1492260885945647256";

test("відправляє embed payload у Discord-канал", async () => {
  const sentMessages = [];
  const client = {
    channels: {
      fetch: async () => ({
        isTextBased: () => true,
        send: async (message) => sentMessages.push(message),
      }),
    },
  };
  const embed = new EmbedBuilder()
    .setTitle("Нагадування")
    .setDescription("Подія почнеться о 18:00.");

  await sendDiscordChannelMessage(
    { embeds: [embed] },
    {
      client,
      channelId: "123",
      roleId: NOTIFICATION_ROLE_ID,
      notification: { id: "sunday-reminder" },
    },
  );

  assert.equal(sentMessages.length, 1);
  assert.deepEqual(sentMessages[0], {
    content: `<@&${NOTIFICATION_ROLE_ID}>`,
    allowedMentions: {
      roles: [NOTIFICATION_ROLE_ID],
    },
    embeds: [embed],
  });
});

test("додає згадку ролі до текстового повідомлення", () => {
  assert.deepEqual(addRoleMention("Текст сповіщення", NOTIFICATION_ROLE_ID), {
    content: `<@&${NOTIFICATION_ROLE_ID}>\nТекст сповіщення`,
    allowedMentions: {
      roles: [NOTIFICATION_ROLE_ID],
    },
  });
});
