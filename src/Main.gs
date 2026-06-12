function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PSG Hours')
    .addItem('Process Uploads', 'showFilePicker')
    .addItem('Show All Tabs', 'showAllTabsMenu')
    .addItem('Refresh Name Dropdowns', 'applyNameValidation')
    .addItem('Setup', 'setupOnce')
    .addToUi();
}

function showAllTabsMenu() {
  showAllTabs();
  ensureLogTab();
  ensureRecordsTab();
  ensureLookupTab();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = ss.getSheets().map(function(s) { return s.getName() + (s.isSheetHidden() ? ' [hidden]' : ''); });
  SpreadsheetApp.getUi().alert(
    'All tabs shown. Found these sheets:\n' + names.join('\n') +
    '\n\nIf _Log or _Lookup are missing, re-run Setup.'
  );
}

function setupOnce() {
  var ui = SpreadsheetApp.getUi();

  var props = PropertiesService.getScriptProperties();

  if (!props.getProperty('GEMINI_API_KEY')) {
    var key = ui.prompt(
      'Gemini API Key',
      'Enter your Gemini API key:',
      ui.ButtonSet.OK_CANCEL
    );
    if (key.getSelectedButton() === ui.Button.OK && key.getResponseText()) {
      props.setProperty('GEMINI_API_KEY', key.getResponseText().trim());
    }
  }

  if (!props.getProperty('DRIVE_FOLDER_ID')) {
    var folder = DriveApp.getFolderById('1Ha8_10y0Xy-hVTeKzKEIYZhHbokwcRRZ');
    props.setProperty('DRIVE_FOLDER_ID', folder.getId());
  }

  if (!props.getProperty('SHEET_ID')) {
    props.setProperty('SHEET_ID', SpreadsheetApp.getActiveSpreadsheet().getId());
  }

  try {
    var parent = DriveApp.getFolderById(props.getProperty('DRIVE_FOLDER_ID'));
    var folders = parent.getFoldersByName('Processed');
    if (!folders.hasNext()) {
      parent.createFolder('Processed');
    }
  } catch (e) {
    // ignore
  }

  showAllTabs();
  ensureLogTab();
  ensureRecordsTab();
  ensureLookupTab();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) ss.deleteSheet(sheet1);

  applyNameValidation();

  ui.alert('Setup complete! All tabs are visible and the PSG Hours menu is ready.');
}

function showFilePicker() {
  var html = HtmlService.createHtmlOutputFromFile('PreviewUI')
    .setWidth(1200)
    .setHeight(800)
    .setTitle('PSG Volunteer Hours \u2014 Process Uploads');
  SpreadsheetApp.getUi().showModalDialog(html, 'PSG Volunteer Hours');
}

function getFilesForPicker() {
  return listUnprocessedFiles();
}

function getLookupNames() {
  return getLookupEntries();
}

function processFileWithGemini(fileId, fileName) {
  trace(fileName, 'file_process', 'INFO', 'Starting processing');

  try {
    var records = parseFile(fileId, fileName);
    var lookup = getLookupEntries();

    for (var i = 0; i < records.length; i++) {
      var match = matchName(records[i].volunteer_name, lookup, fileName);
      records[i].matched_name = match.matchedName;
      records[i].match_status = match.status;
      records[i].match_candidates = match.candidates;
    }

    var duplicates = checkForDuplicateEvents(records);

    trace(fileName, 'file_process', 'SUCCESS', records.length + ' records extracted', {
      records_count: records.length,
      duplicates_found: duplicates.length
    });

    return { records: records, duplicates: duplicates };
  } catch (e) {
    trace(fileName, 'file_process', 'ERROR', e.toString());
    throw e;
  }
}

function checkForDuplicateEvents(records) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(RECORDS_TAB);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var existing = {};
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    var key = (r[0] || '') + '|' + (r[1] || '');
    existing[key] = true;
  }

  var duplicates = [];
  for (var j = 0; j < records.length; j++) {
    var key = records[j].date + '|' + records[j].event_name;
    if (existing[key]) {
      duplicates.push(records[j]);
    }
  }

  if (duplicates.length > 0) {
    trace('', 'duplicate_check', 'WARN', duplicates.length + ' records match existing (date, event) pairs', {
      count: duplicates.length
    });
  }

  return duplicates;
}

function confirmRecords(fileId, fileName, records, force) {
  if (!records || !records.length) {
    return { success: false, error: 'No records to write' };
  }

  if (!force) {
    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      if (rec.date && isNaN(new Date(rec.date).getTime())) {
        return { success: false, error: 'Row ' + (i + 1) + ': invalid date format' };
      }
      if (!rec.volunteer_name || !rec.volunteer_name.toString().trim()) {
        return { success: false, error: 'Row ' + (i + 1) + ': volunteer name is required' };
      }
      var h = parseFloat(rec.hours);
      if (isNaN(h) || h < 0) {
        return { success: false, error: 'Row ' + (i + 1) + ': invalid hours value' };
      }
    }
  }

  var rows = [];
  for (var i = 0; i < records.length; i++) {
    rows.push([
      records[i].date,
      records[i].event_name,
      records[i].volunteer_name,
      parseFloat(records[i].hours) || 0,
    ]);
  }

  var moveWarning = '';
  try {
    appendRecords(rows, fileName);
    applyNameValidation();
    trace(fileName, 'record_write', 'SUCCESS', rows.length + ' records written');
  } catch (e) {
    trace(fileName, 'record_write', 'ERROR', e.toString());
    return { success: false, error: e.toString() };
  }

  try {
    moveToProcessed(fileId);
    trace(fileName, 'record_write', 'INFO', 'File moved to Processed folder');
  } catch (moveErr) {
    moveWarning = 'Could not move file to Processed folder: ' + moveErr.toString();
    trace(fileName, 'record_write', 'WARN', moveWarning);
  }

  showAllTabs();

  var result = { success: true, records_written: rows.length };
  if (moveWarning) result.move_warning = moveWarning;
  return result;
}
