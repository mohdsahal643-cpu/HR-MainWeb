const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Enquiries";

const HEADERS = [
  "Timestamp",
  "Full Name",
  "Email",
  "Phone",
  "Industry",
  "Message",
  "Page",
  "Submitted At"
];

function doGet() {
  return jsonResponse({
    ok: true,
    message: "We Help HR enquiry endpoint is running."
  });
}

function doPost(e) {
  try {
    const data = readRequestData(e);
    const fullName = clean(data.fullName);
    const email = clean(data.email);
    const phone = clean(data.phone);
    const industry = clean(data.industry);
    const message = clean(data.message);
    const page = clean(data.page);
    const submittedAt = clean(data.submittedAt);

    if (!fullName || !email || !phone || !industry) {
      return jsonResponse({
        ok: false,
        error: "Missing required fields."
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    try {
      const sheet = getSheet();
      ensureHeaders(sheet);
      sheet.appendRow([
        new Date(),
        fullName,
        email,
        phone,
        industry,
        message,
        page,
        submittedAt
      ]);
    } finally {
      lock.releaseLock();
    }

    return jsonResponse({
      ok: true,
      message: "Enquiry saved."
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message
    });
  }
}

function readRequestData(e) {
  if (e && e.parameter && Object.keys(e.parameter).length) {
    return e.parameter;
  }

  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      return {};
    }
  }

  return {};
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeaders = currentHeaders.some((value) => value);

  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function clean(value) {
  return String(value || "").trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
