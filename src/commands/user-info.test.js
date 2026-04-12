const assert = require("node:assert/strict");
const test = require("node:test");

const { MessageFlags } = require("discord.js");
const { handleUserInfoCommandInteraction, isValidInitials, normalizeInitials } = require("./user-info");

test("нормалізує й валідує ініціали", () => {
  assert.equal(normalizeInitials("  Ihor   Burevii  "), "Ihor Burevii");
  assert.equal(isValidInitials("Ihor Burevii"), true);
  assert.equal(isValidInitials("Ігор Буревій"), true);
  assert.equal(isValidInitials("A"), false);
  assert.equal(isValidInitials("1111-1111"), false);
});

test("зберігає номер картки для поточного користувача", async () => {
  const replies = [];
  const updates = [];
  const interaction = createInteraction({
    commandName: "номер_карти",
    strings: { номер: "1111-1111" },
    replies,
  });

  const handled = await handleUserInfoCommandInteraction(interaction, {
    now: () => new Date("2026-04-12T10:00:00.000Z"),
    store: {
      updateUser: async (userId, patch, options) => updates.push({ options, patch, userId }),
    },
  });

  assert.equal(handled, true);
  assert.deepEqual(updates, [
    {
      options: { now: new Date("2026-04-12T10:00:00.000Z") },
      patch: { cardNumber: "1111-1111" },
      userId: "user-1",
    },
  ]);
  assert.equal(replies[0].flags, MessageFlags.Ephemeral);
  assert.match(replies[0].content, /Номер картки збережено/);
});

test("відхиляє некоректний номер картки", async () => {
  const replies = [];
  const updates = [];
  const interaction = createInteraction({
    commandName: "номер_карти",
    strings: { номер: "11111111" },
    replies,
  });

  await handleUserInfoCommandInteraction(interaction, {
    store: {
      updateUser: async (...args) => updates.push(args),
    },
  });

  assert.equal(updates.length, 0);
  assert.equal(replies[0].content, "Номер картки має бути у форматі `1111-1111`.");
});

test("не дозволяє змінювати чужі дані без прав", async () => {
  const replies = [];
  const updates = [];
  const interaction = createInteraction({
    commandName: "ініціали",
    strings: { значення: "Ihor Burevii" },
    targetUser: { id: "user-2" },
    replies,
  });

  await handleUserInfoCommandInteraction(interaction, {
    store: {
      updateUser: async (...args) => updates.push(args),
    },
  });

  assert.equal(updates.length, 0);
  assert.equal(replies[0].content, "Можна змінювати чужу інформацію тільки з правами адміністратора.");
});

test("дозволяє змінювати чужі дані з адмін-роллю", async () => {
  const replies = [];
  const updates = [];
  const interaction = createInteraction({
    commandName: "ініціали",
    roles: new Set(["admin-role"]),
    strings: { значення: "  Ihor   Burevii  " },
    targetUser: { id: "user-2" },
    replies,
  });

  await handleUserInfoCommandInteraction(interaction, {
    adminRoleId: "admin-role",
    store: {
      updateUser: async (userId, patch) => updates.push({ patch, userId }),
    },
  });

  assert.deepEqual(updates, [
    {
      patch: { initials: "Ihor Burevii" },
      userId: "user-2",
    },
  ]);
  assert.match(replies[0].content, /Ініціали збережено/);
});

test("показує інформацію про поточного користувача приватно", async () => {
  const replies = [];
  const interaction = createInteraction({
    commandName: "інформація_про_мене",
    replies,
  });

  await handleUserInfoCommandInteraction(interaction, {
    store: {
      getUser: async (userId) => {
        assert.equal(userId, "user-1");
        return {
          cardNumber: "1111-1111",
          initials: "Ihor Burevii",
        };
      },
    },
  });

  const embed = replies[0].embeds[0].toJSON();

  assert.equal(replies[0].flags, MessageFlags.Ephemeral);
  assert.equal(embed.title, "Інформація про мене");
  assert.deepEqual(embed.fields, [
    {
      name: "Ініціали",
      value: "Ihor Burevii",
    },
    {
      name: "Номер картки",
      value: "1111-1111",
    },
  ]);
});

function createInteraction({
  commandName,
  strings = {},
  targetUser = null,
  user = { id: "user-1" },
  roles = new Set(),
  replies = [],
} = {}) {
  return {
    commandName,
    isChatInputCommand: () => true,
    member: {
      roles: {
        cache: {
          has: (roleId) => roles.has(roleId),
        },
      },
    },
    memberPermissions: {
      has: () => false,
    },
    options: {
      getString: (name) => strings[name],
      getUser: (name) => (name === "користувач" ? targetUser : null),
    },
    reply: async (response) => replies.push(response),
    user,
  };
}
