const assert = require("node:assert/strict");
const test = require("node:test");

process.env.TZ = "Europe/Kyiv";

const { getCurrentReportPeriod, isDateInReportPeriod } = require("./period");

test("рахує звітний період від понеділка 00:00 до неділі 23:59", () => {
  const period = getCurrentReportPeriod(new Date("2026-04-15T12:30:00"));

  assert.equal(period.startDate.toString(), new Date("2026-04-13T00:00:00").toString());
  assert.equal(period.endDate.toString(), new Date("2026-04-19T23:59:59.999").toString());
});

test("для неділі лишається поточний звітний тиждень", () => {
  const period = getCurrentReportPeriod(new Date("2026-04-19T22:00:00"));

  assert.equal(period.startDate.toString(), new Date("2026-04-13T00:00:00").toString());
  assert.equal(period.endDate.toString(), new Date("2026-04-19T23:59:59.999").toString());
});

test("перевіряє належність дати до звітного періоду", () => {
  const period = getCurrentReportPeriod(new Date("2026-04-15T12:30:00"));

  assert.equal(isDateInReportPeriod(new Date("2026-04-13T00:00:00"), period), true);
  assert.equal(isDateInReportPeriod(new Date("2026-04-19T23:59:59.999"), period), true);
  assert.equal(isDateInReportPeriod(new Date("2026-04-20T00:00:00"), period), false);
});
