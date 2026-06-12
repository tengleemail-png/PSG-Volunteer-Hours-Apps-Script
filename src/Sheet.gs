var _ss = null;

function getSpreadsheet() {
  if (!_ss) {
    _ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  return _ss;
}

function resetSpreadsheetCache() {
  _ss = null;
}

function showAllTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    sheets[i].showSheet();
  }
}

function ensureLogTab() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(LOG_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_TAB);
    sheet.appendRow(['Timestamp', 'Filename', 'Step', 'Status', 'Message', 'Details']);
  }
}

function ensureRecordsTab() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(RECORDS_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(RECORDS_TAB);
    sheet.appendRow(['Date', 'Event', 'Volunteer Name', 'Hours', 'source_file']);
    return;
  }
  var headerRow = sheet.getRange(1, 1, 1, 5).getValues()[0];
  if (!headerRow[4]) {
    sheet.getRange(1, 5).setValue('source_file');
  }
}

function ensureLookupTab() {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(LOOKUP_TAB);
  if (!sheet) {
    sheet = ss.insertSheet(LOOKUP_TAB);
    sheet.appendRow(['Given Name', 'Surname', 'Preferred Name', 'Combined Name', 'Year Joined']);
    sheet.getRange(2, 1, 1, 5).setFontWeight(null);
  }
}

function getLookupEntries() {
  ensureLookupTab();
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(LOOKUP_TAB);

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var entries = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var combined = (row[3] || '').toString().trim();
    if (!combined) continue;
    entries.push({
      given_name: (row[0] || '').toString().trim(),
      surname: (row[1] || '').toString().trim(),
      preferred_name: (row[2] || '').toString().trim(),
      combined_name: combined,
      year_joined: row[4] ? row[4].toString().trim() : ''
    });
  }
  return entries;
}

function appendRecords(rows, sourceFile) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(RECORDS_TAB);
  if (!sheet) throw new Error('Records tab not found');
  var augmented = [];
  for (var i = 0; i < rows.length; i++) {
    var copy = rows[i].slice();
    copy.push(sourceFile || '');
    augmented.push(copy);
  }
  var range = sheet.getRange(sheet.getLastRow() + 1, 1, augmented.length, augmented[0].length);
  range.setValues(augmented);
}

function applyNameValidation() {
  var ss = getSpreadsheet();
  var recordsSheet = ss.getSheetByName(RECORDS_TAB);
  var lookupSheet = ss.getSheetByName(LOOKUP_TAB);
  if (!recordsSheet || !lookupSheet) return;

  var lastRow = lookupSheet.getLastRow();
  if (lastRow < 2) return;

  var namesRange = lookupSheet.getRange(2, 4, lastRow - 1, 1);

  var validation = SpreadsheetApp.newDataValidation()
    .requireValueInRange(namesRange, true)
    .setAllowInvalid(true)
    .build();

  recordsSheet.getRange(2, 3, 1000, 1).setDataValidation(validation);
}
