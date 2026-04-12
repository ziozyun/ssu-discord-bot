const assert = require("node:assert/strict");
const test = require("node:test");

const { shouldIgnoreReportMessage } = require("./common");

test("ігнорує службові повідомлення початку і кінця звітування", () => {
  assert.equal(
    shouldIgnoreReportMessage({
      content: [
        "⬆️-⬆️-⬆️-⬆️-⬆️",
        "КІНЕЦЬ ЗВІТУВАННЯ ЗА [23.02.2026 - 01.03.2026] ТИЖДЕНЬ.",
        "🔁-🔁-🔁-🔁-🔁",
        "ПОЧАТОК ЗВІТУВАННЯ ЗА [02.03.2026 - 08.03.2026] ТИЖДЕНЬ.",
        "⬇️-⬇️-⬇️-⬇️-⬇️",
      ].join("\n"),
    }),
    true,
  );
});

test("не ігнорує звичайне повідомлення звіту", () => {
  assert.equal(
    shouldIgnoreReportMessage({
      content: "Угонка <@user-2>",
    }),
    false,
  );
});
