function getLookupEntries() {
  var sheetId = getSheetId();
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(LOOKUP_TAB);
  if (!sheet) return [];

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

function appendRecords(rows) {
  var sheetId = getSheetId();
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(RECORDS_TAB);
  if (!sheet) throw new Error('Records tab not found');
  var range = sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length);
  range.setValues(rows);
}

function logProcessing(filename, status, recordsAdded, notes) {
  var sheetId = getSheetId();
  var ss = SpreadsheetApp.openById(sheetId);
  var sheet = ss.getSheetByName(LOG_TAB);
  if (!sheet) throw new Error('Log tab not found');
  var now = Utilities.formatDate(new Date(), 'Asia/Singapore', 'yyyy-MM-dd HH:mm:ss');
  sheet.appendRow([now, filename, status, recordsAdded, notes || '']);
}
