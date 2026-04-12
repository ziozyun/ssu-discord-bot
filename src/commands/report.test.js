const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { MessageFlags } = require("discord.js");
const {
  REPORT_COMMAND_NAME,
  buildReportCommandResponse,
  handleReportCommandInteraction,
} = require("./report");

test("формує приватну відповідь для /звіт", async () => {
  const deferredReplies = [];
  const editedReplies = [];
  const interaction = {
    client: { id: "client-1" },
    commandName: REPORT_COMMAND_NAME,
    isChatInputCommand: () => true,
    deferReply: async (response) => {
      interaction.deferred = true;
      deferredReplies.push(response);
    },
    editReply: async (response) => editedReplies.push(response),
  };

  const handled = await handleReportCommandInteraction(interaction, {
    now: () => new Date("2026-04-15T12:30:00"),
    runReports: async ({ client }) => {
      assert.equal(client.id, "client-1");

      return {
        period: {
          startDate: new Date("2026-04-13T00:00:00"),
          endDate: new Date("2026-04-19T23:59:59.999"),
        },
        reports: [],
      };
    },
  });

  assert.equal(handled, true);
  assert.deepEqual(deferredReplies, [{ flags: MessageFlags.Ephemeral }]);
  assert.equal(editedReplies.length, 1);
  assert.equal(editedReplies[0].embeds[0].toJSON().title, "Тижневий звіт");
});

test("показує статус, якщо типи звітів ще не налаштовані", () => {
  const response = buildReportCommandResponse({
    period: {
      startDate: new Date("2026-04-13T00:00:00"),
      endDate: new Date("2026-04-19T23:59:59.999"),
    },
    reports: [],
  });
  const embed = response.embeds[0].toJSON();

  assert.equal(embed.title, "Тижневий звіт");
  assert.match(embed.description, /Період:/);
  assert.deepEqual(embed.fields, [
    {
      name: "Статус",
      value: "Поки не налаштовано жодного типу звіту для обробки.",
    },
  ]);
});
