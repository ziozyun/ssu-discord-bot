const assert = require("node:assert/strict");
const test = require("node:test");

const { writeSheetRows } = require("./sheets");

test("очищає діапазон і записує рядки в Google Sheets", async () => {
  const calls = [];
  const sheets = {
    spreadsheets: {
      values: {
        clear: async (request) => calls.push(["clear", request]),
        update: async (request) => {
          calls.push(["update", request]);

          return { data: { updatedRows: request.requestBody.values.length } };
        },
      },
    },
  };

  const result = await writeSheetRows({
    range: "'Тест'!A:B",
    rows: [["Ihor Burevii", 2]],
    sheets,
    spreadsheetId: "sheet-1",
  });

  assert.deepEqual(result, { updatedRows: 1 });
  assert.deepEqual(calls, [
    [
      "clear",
      {
        spreadsheetId: "sheet-1",
        range: "'Тест'!A:B",
      },
    ],
    [
      "update",
      {
        spreadsheetId: "sheet-1",
        range: "'Тест'!A:B",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Ihor Burevii", 2]],
        },
      },
    ],
  ]);
});
