function listUnprocessedFiles() {
  var folderId = getDriveFolderId();
  var folder = DriveApp.getFolderById(folderId);
  var files = [];
  var iter = folder.getFiles();

  while (iter.hasNext()) {
    var file = iter.next();
    var name = file.getName().toLowerCase();
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') ||
        name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      files.push({ id: file.getId(), name: file.getName(), size: file.getSize() });
    }
  }

  var processedIds = {};
  var processedIter = folder.getFoldersByName(PROCESSED_FOLDER_NAME);
  if (processedIter.hasNext()) {
    var processedFolder = processedIter.next();
    var pfIter = processedFolder.getFiles();
    while (pfIter.hasNext()) {
      var pf = pfIter.next();
      processedIds[pf.getId()] = true;
    }
    files = files.filter(function (f) { return !processedIds[f.id]; });
  }

  files.sort(function (a, b) { return a.name.localeCompare(b.name); });
  trace('', 'file_discovery', 'INFO', 'Found ' + files.length + ' unprocessed files', { total_supported: files.length });
  return files;
}

function getFileBlob(fileId) {
  return DriveApp.getFileById(fileId).getBlob();
}

function readExcelAsText(fileId, fileName) {
  var file = DriveApp.getFileById(fileId);
  var blob = file.getBlob();
  var resource = { title: '_temp_psg_' + fileName, mimeType: MimeType.GOOGLE_SHEETS };
  var newFile = Drive.Files.insert(resource, blob, { convert: true });
  try {
    var ss = SpreadsheetApp.openById(newFile.id);
    var sheet = ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();
    return data.map(function(row) { return row.join('\t'); }).join('\n');
  } finally {
    Drive.Files.remove(newFile.id);
  }
}

function readCsvAsText(fileId, fileName) {
  return DriveApp.getFileById(fileId).getBlob().getDataAsString();
}

function moveToProcessed(fileId) {
  var file = DriveApp.getFileById(fileId);
  var folderId = getDriveFolderId();
  var parent = DriveApp.getFolderById(folderId);
  var processedFolders = parent.getFoldersByName(PROCESSED_FOLDER_NAME);
  var processedFolder;
  if (processedFolders.hasNext()) {
    processedFolder = processedFolders.next();
  } else {
    processedFolder = parent.createFolder(PROCESSED_FOLDER_NAME);
  }
  file.moveTo(processedFolder);
}

function isImageFile(fileName) {
  var n = fileName.toLowerCase();
  return n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.png');
}

function isExcelFile(fileName) {
  var n = fileName.toLowerCase();
  return n.endsWith('.xlsx') || n.endsWith('.xls');
}

function isCsvFile(fileName) {
  return fileName.toLowerCase().endsWith('.csv');
}
