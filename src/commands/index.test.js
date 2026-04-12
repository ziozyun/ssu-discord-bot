const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { MessageFlags } = require("discord.js");
const { handleCommandInteraction } = require(".");

test("відповідає на /події приватним повідомленням для користувача", async () => {
  const replies = [];
  const interaction = {
    commandName: "події",
    isChatInputCommand: () => true,
    options: {
      getString: () => "today",
    },
    reply: async (response) => replies.push(response),
  };

  const handled = await handleCommandInteraction(interaction, {
    now: () => new Date(2026, 3, 12, 7, 0),
  });

  assert.equal(handled, true);
  assert.equal(replies.length, 1);
  assert.equal(replies[0].flags, MessageFlags.Ephemeral);
  assert.equal(replies[0].embeds.length, 1);
});
