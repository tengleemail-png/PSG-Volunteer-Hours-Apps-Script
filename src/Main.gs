function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('PSG Hours')
    .addItem('Process Uploads', 'showFilePicker')
    .addItem('Setup', 'setupOnce')
    .addToUi();
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

  ui.alert('Setup complete! The PSG Hours menu is ready.');
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
  var records = parseFile(fileId, fileName);
  var lookup = getLookupEntries();

  for (var i = 0; i < records.length; i++) {
    var match = matchName(records[i].volunteer_name, lookup);
    records[i].matched_name = match.matchedName;
    records[i].match_status = match.status;
    records[i].match_candidates = match.candidates;
  }

  return records;
}

function confirmRecords(fileName, records) {
  if (!records || !records.length) {
    return { success: false, error: 'No records to write' };
  }

  try {
    var rows = [];
    for (var i = 0; i < records.length; i++) {
      rows.push([
        records[i].date,
        records[i].event_name,
        records[i].volunteer_name,
        records[i].hours,
      ]);
    }

    appendRecords(rows);
    logProcessing(fileName, 'success', rows.length);

    var files = listUnprocessedFiles();
    for (var j = 0; j < files.length; j++) {
      if (files[j].name === fileName) {
        moveToProcessed(files[j].id);
        break;
      }
    }

    return { success: true, records_written: rows.length };
  } catch (e) {
    logProcessing(fileName, 'error', 0, e.toString());
    return { success: false, error: e.toString() };
  }
}
