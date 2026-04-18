const fs = require("node:fs");
const { google } = require("googleapis");

const DEFAULT_SPREADSHEET_ID = "1KtZZtCc_P5E4kAyhXChwtkUwgb8QKtUCjFVFqaeeSic";
const DEFAULT_GOOGLE_CREDENTIALS_FILE = "secrets/google-service-account.json";

function createSheetsClient({
  credentialsFile = process.env.GOOGLE_SERVICE_ACCOUNT_FILE || DEFAULT_GOOGLE_CREDENTIALS_FILE,
} = {}) {
  const credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf8"));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

async function writeSheetRows({
  range,
  rows,
  sheets = createSheetsClient(),
  spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
} = {}) {
  if (!range) {
    throw new Error("range є обов'язковим для запису в Google Sheets.");
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range,
  });

  if (!rows.length) {
    return { updatedRows: 0 };
  }

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: rows,
    },
  });

  return {
    updatedRows: response.data.updatedRows || 0,
  };
}

async function readSheetRows({
  range,
  sheets = createSheetsClient(),
  spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
} = {}) {
  if (!range) {
    throw new Error("range є обов'язковим для читання з Google Sheets.");
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return response.data.values || [];
}

module.exports = {
  DEFAULT_GOOGLE_CREDENTIALS_FILE,
  DEFAULT_SPREADSHEET_ID,
  createSheetsClient,
  readSheetRows,
  writeSheetRows,
};
